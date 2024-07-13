const defaults = {
    pgn: '*',
    fen: undefined,
    showPlayers: 'auto',
    showClocks: true,
    showMoves: 'auto',
    showControls: true,
    scrollToMove: true,
    orientation: undefined,
    initialPly: 0,
    chessground: {},
    drawArrows: true,
    menu: {
        getPgn: {
            enabled: true,
            fileName: undefined, // name of the file when user clicks "Download PGN". Leave empty for automatic name.
        },
    },
    lichess: 'https://lichess.org',
    classes: undefined, // CSS classes to set on the root element. Defaults to the element classes before being replaced by LPV.
};
export default function (element, cfg) {
    const opts = { ...defaults };
    deepMerge(opts, cfg);
    if (opts.fen)
        opts.pgn = `[FEN "${opts.fen}"]\n${opts.pgn}`;
    if (!opts.classes)
        opts.classes = element.className;
    return opts;
}
function deepMerge(base, extend) {
    for (const key in extend) {
        if (typeof extend[key] !== 'undefined') {
            if (isPlainObject(base[key]) && isPlainObject(extend[key]))
                deepMerge(base[key], extend[key]);
            else
                base[key] = extend[key];
        }
    }
}
function isPlainObject(o) {
    if (typeof o !== 'object' || o === null)
        return false;
    const proto = Object.getPrototypeOf(o);
    return proto === Object.prototype || proto === null;
}
//# sourceMappingURL=config.js.map