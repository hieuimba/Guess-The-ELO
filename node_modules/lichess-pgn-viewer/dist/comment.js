export const parseComments = (comments) => comments.reduce(([strs, shapes], comment) => {
    const [str, sps] = parseComment(comment);
    return [[...strs, ...(str ? [str] : [])], shapes.concat(sps)];
}, [[], []]);
export const parseComment = (comment) => {
    const [s1, circles] = parseCircles(comment.trim());
    const [s2, arrows] = parseArrows(s1.trim());
    const s3 = s2
        .replace(clockRemoveRegex, '')
        .replace(tcecClockRemoveRegex, '')
        .trim()
        .replace(/\s{2,}/g, ' ');
    return [s3, [...circles, ...arrows]];
};
const parseCircles = (comment) => {
    const circles = Array.from(comment.matchAll(circlesRegex))
        .map(m => m[1])
        .flatMap(s => s.split(','))
        .map(s => s.trim())
        .map(s => ({
        orig: s.slice(1),
        brush: brushOf(s[0]),
    }));
    return [circles.length ? comment.replace(circlesRemoveRegex, '') : comment, circles];
};
const parseArrows = (comment) => {
    const arrows = Array.from(comment.matchAll(arrowsRegex))
        .map(m => m[1])
        .flatMap(s => s.split(','))
        .map(s => s.trim())
        .map(s => ({
        orig: s.slice(1, 3),
        dest: s.slice(3, 5),
        brush: brushOf(s[0]),
    }));
    return [arrows.length ? comment.replace(arrowsRemoveRegex, '') : comment, arrows];
};
const circlesRegex = /\[\%csl[\s\r\n]+((?:\w{3}[,\s]*)+)\]/g;
const circlesRemoveRegex = /\[\%csl[\s\r\n]+((?:\w{3}[,\s]*)+)\]/g;
const arrowsRegex = /\[\%cal[\s\r\n]+((?:\w{5}[,\s]*)+)\]/g;
const arrowsRemoveRegex = /\[\%cal[\s\r\n]+((?:\w{5}[,\s]*)+)\]/g;
const clockRemoveRegex = /\[\%clk[\s\r\n]+[\d:\.]+\]/g;
const tcecClockRemoveRegex = /tl=[\d:\.]+/g;
const brushOf = (c) => (c == 'G' ? 'green' : c == 'R' ? 'red' : c == 'Y' ? 'yellow' : 'blue');
//# sourceMappingURL=comment.js.map