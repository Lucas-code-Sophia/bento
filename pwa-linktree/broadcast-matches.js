(function () {
    const DEFAULT_TIME_ZONE = 'Europe/Paris';
    const DEFAULT_MATCH_DURATION_MINUTES = 120;

    const matches = [
        {
            id: 'france-senegal-2026-06-16',
            competition: 'Coupe du monde 2026',
            stage: 'Groupe I',
            homeTeam: 'France',
            awayTeam: 'Sénégal',
            startAt: '2026-06-16T19:00:00Z',
            endAt: '2026-06-16T21:00:00Z',
            venue: 'MetLife Stadium, New York/New Jersey',
            matchNumber: 17,
            broadcast: true,
            franceMatch: true
        },
        {
            id: 'france-iraq-2026-06-22',
            competition: 'Coupe du monde 2026',
            stage: 'Groupe I',
            homeTeam: 'France',
            awayTeam: 'Irak',
            startAt: '2026-06-22T21:00:00Z',
            endAt: '2026-06-22T23:00:00Z',
            venue: 'Lincoln Financial Field, Philadelphie',
            matchNumber: 42,
            broadcast: true,
            franceMatch: true
        },
        {
            id: 'norway-france-2026-06-26',
            competition: 'Coupe du monde 2026',
            stage: 'Groupe I',
            homeTeam: 'Norvège',
            awayTeam: 'France',
            startAt: '2026-06-26T19:00:00Z',
            endAt: '2026-06-26T21:00:00Z',
            venue: 'Gillette Stadium, Boston',
            matchNumber: 61,
            broadcast: true,
            franceMatch: true
        },
        {
            id: 'france-sweden-2026-06-30',
            competition: 'Coupe du monde 2026',
            stage: '16e de finale',
            homeTeam: 'France',
            awayTeam: 'Suède',
            startAt: '2026-06-30T21:00:00Z',
            endAt: '2026-07-01T00:00:00Z',
            venue: 'MetLife Stadium, New York/New Jersey',
            matchNumber: 77,
            broadcast: true,
            franceMatch: true
        }
        // Ajoute ici d'autres diffusions plus tard avec broadcast: true.
    ];

    function toDate(value) {
        return new Date(value);
    }

    function getMatchStartDate(match) {
        return toDate(match.startAt);
    }

    function getMatchEndDate(match) {
        if (match.endAt) {
            return toDate(match.endAt);
        }

        return new Date(getMatchStartDate(match).getTime() + DEFAULT_MATCH_DURATION_MINUTES * 60 * 1000);
    }

    function isMatchUpcoming(match, now) {
        return getMatchEndDate(match).getTime() > now.getTime();
    }

    function byStartDate(firstMatch, secondMatch) {
        return getMatchStartDate(firstMatch).getTime() - getMatchStartDate(secondMatch).getTime();
    }

    function getUpcomingMatches(options) {
        const settings = options || {};
        const now = settings.now || new Date();

        return matches
            .filter((match) => match.broadcast)
            .filter((match) => settings.franceOnly ? match.franceMatch : true)
            .filter((match) => isMatchUpcoming(match, now))
            .sort(byStartDate);
    }

    function getNextFranceMatch(now) {
        return getUpcomingMatches({
            now: now || new Date(),
            franceOnly: true
        })[0] || null;
    }

    function getMatchStatus(match, now) {
        const currentDate = now || new Date();
        const startDate = getMatchStartDate(match);
        const endDate = getMatchEndDate(match);

        if (currentDate >= startDate && currentDate < endDate) {
            return 'En cours';
        }

        return 'Prochain match';
    }

    function formatDate(match, options) {
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: options && options.shortWeekday ? 'short' : 'long',
            day: 'numeric',
            month: 'long',
            timeZone: DEFAULT_TIME_ZONE
        }).format(getMatchStartDate(match));
    }

    function formatTime(match) {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: DEFAULT_TIME_ZONE
        }).format(getMatchStartDate(match));
    }

    function formatCompactDateTime(match) {
        return `${formatDate(match, { shortWeekday: true })} · ${formatTime(match)}`;
    }

    function getMatchTitle(match) {
        return `${match.homeTeam} - ${match.awayTeam}`;
    }

    window.SophiaBroadcastMatches = matches;
    window.SophiaMatches = {
        getMatchEndDate,
        getMatchStartDate,
        getMatchStatus,
        getMatchTitle,
        getNextFranceMatch,
        getUpcomingMatches,
        formatCompactDateTime,
        formatDate,
        formatTime
    };
})();
