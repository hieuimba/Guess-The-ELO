import { Opts } from './interfaces';
export default function (element: HTMLElement, cfg: Partial<Opts>): {
    pgn: string;
    fen?: string | undefined;
    chessground: import("chessground/config").Config;
    orientation?: "white" | "black" | undefined;
    showPlayers: import("./interfaces").ShowPlayers;
    showMoves: import("./interfaces").ShowMoves;
    showClocks: boolean;
    showControls: boolean;
    initialPly: number | "last";
    scrollToMove: boolean;
    drawArrows: boolean;
    menu: {
        getPgn: {
            enabled?: boolean | undefined;
            fileName?: string | undefined;
        };
    };
    lichess: import("./interfaces").Lichess;
    classes?: string | undefined;
    translate?: import("./interfaces").Translate | undefined;
};
