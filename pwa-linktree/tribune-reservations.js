(function () {
    const TABLE_NAME = 'tribune_reservations';

    const places = [
        { code: 'P1', level: 'presidentielle', label: 'Présidentielle P1' },
        { code: 'P2', level: 'presidentielle', label: 'Présidentielle P2' },
        { code: 'P3', level: 'presidentielle', label: 'Présidentielle P3' },
        { code: 'P4', level: 'presidentielle', label: 'Présidentielle P4' },
        { code: 'V1', level: 'vip', label: 'VIP V1' },
        { code: 'V2', level: 'vip', label: 'VIP V2' },
        { code: 'V3', level: 'vip', label: 'VIP V3' },
        { code: 'V4', level: 'vip', label: 'VIP V4' },
        { code: 'C1', level: 'categorie_1', label: 'Catégorie 1 C1' },
        { code: 'C2', level: 'categorie_1', label: 'Catégorie 1 C2' },
        { code: 'C3', level: 'categorie_1', label: 'Catégorie 1 C3' },
        { code: 'C4', level: 'categorie_1', label: 'Catégorie 1 C4' },
        { code: 'TH1', level: 'tabouret_haut', label: 'Tabouret haut TH1' },
        { code: 'TH2', level: 'tabouret_haut', label: 'Tabouret haut TH2' },
        { code: 'TB1', level: 'tabouret_bas', label: 'Tabouret bas TB1' },
        { code: 'TB2', level: 'tabouret_bas', label: 'Tabouret bas TB2' }
    ];

    let client = null;

    function getClient() {
        if (client) {
            return client;
        }

        if (!window.supabase || !window.SophiaSupabaseConfig) {
            throw new Error('Supabase client unavailable');
        }

        client = window.supabase.createClient(
            window.SophiaSupabaseConfig.url,
            window.SophiaSupabaseConfig.anonKey
        );

        return client;
    }

    function getPlace(code) {
        return places.find((place) => place.code === code) || null;
    }

    function getPlaceLabel(code) {
        const place = getPlace(code);
        return place ? place.label : code;
    }

    function normalizePlaceCodes(value) {
        const rawCodes = Array.isArray(value)
            ? value
            : String(value || '').split(',');

        return rawCodes
            .map((code) => String(code || '').trim())
            .filter(Boolean)
            .filter((code, index, codes) => codes.indexOf(code) === index);
    }

    function getReservationPlaceCodes(reservation) {
        return normalizePlaceCodes(reservation && reservation.place_code);
    }

    function getReservationPlaceLabels(reservation) {
        return getReservationPlaceCodes(reservation).map(getPlaceLabel);
    }

    function getReservationKey(matchId, placeCode) {
        return `${matchId}::${placeCode}`;
    }

    function mapConfirmedReservations(reservations) {
        return (reservations || []).reduce((map, reservation) => {
            getReservationPlaceCodes(reservation).forEach((placeCode) => {
                map[getReservationKey(reservation.match_id, placeCode)] = reservation;
            });
            return map;
        }, {});
    }

    async function fetchConfirmedReservations(matchIds) {
        if (!matchIds || matchIds.length === 0) {
            return [];
        }

        const { data, error } = await getClient()
            .from(TABLE_NAME)
            .select('id, match_id, place_code, place_label, level, customer_name, party_size, status, reserved_at')
            .in('match_id', matchIds)
            .eq('status', 'confirmed')
            .order('reserved_at', { ascending: true });

        if (error) {
            throw error;
        }

        return data || [];
    }

    async function fetchReservationsForMatch(matchId) {
        const { data, error } = await getClient()
            .from(TABLE_NAME)
            .select('*')
            .eq('match_id', matchId)
            .eq('status', 'confirmed')
            .order('reserved_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    }

    async function createReservation(payload) {
        const placeCodes = normalizePlaceCodes(payload.place_codes || payload.place_code);
        const selectedPlaces = placeCodes.map(getPlace);

        if (!placeCodes.length || selectedPlaces.some((place) => !place)) {
            throw new Error('Place inconnue');
        }

        const labels = placeCodes.map(getPlaceLabel);
        const firstPlace = selectedPlaces[0];

        const { data, error } = await getClient()
            .from(TABLE_NAME)
            .insert({
                match_id: payload.match_id,
                place_code: placeCodes.join(', '),
                place_label: labels.join(' · '),
                level: firstPlace.level,
                customer_name: payload.customer_name,
                customer_phone: payload.customer_phone || null,
                party_size: payload.party_size || 1,
                notes: payload.notes || null,
                status: 'confirmed'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async function cancelReservation(id) {
        const endpoint = `${window.SophiaSupabaseConfig.url}/rest/v1/${TABLE_NAME}?id=eq.${encodeURIComponent(id)}&status=eq.confirmed`;
        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                apikey: window.SophiaSupabaseConfig.anonKey,
                Authorization: `Bearer ${window.SophiaSupabaseConfig.anonKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
            },
            body: JSON.stringify({ status: 'cancelled' })
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Annulation refusée par Supabase');
        }

        return true;
    }

    window.SophiaTribuneReservations = {
        cancelReservation,
        createReservation,
        fetchConfirmedReservations,
        fetchReservationsForMatch,
        getClient,
        getPlace,
        getPlaceLabel,
        getReservationPlaceCodes,
        getReservationPlaceLabels,
        getReservationKey,
        mapConfirmedReservations,
        normalizePlaceCodes,
        places,
        tableName: TABLE_NAME
    };
})();
