import { Rules, Outcome, Square } from './types.js';
import { FenError } from './fen.js';
import { Position, PositionError, FromSetupOpts } from './chess.js';
import { Result } from '@badrap/result';
export interface Game<T> {
    headers: Map<string, string>;
    comments?: string[];
    moves: Node<T>;
}
export declare const defaultGame: <T>(initHeaders?: () => Map<string, string>) => Game<T>;
export declare class Node<T> {
    children: ChildNode<T>[];
    mainline(): Iterable<T>;
}
export declare class ChildNode<T> extends Node<T> {
    data: T;
    constructor(data: T);
}
export declare const isChildNode: <T>(node: Node<T>) => node is ChildNode<T>;
export declare class Box<T> {
    value: T;
    constructor(value: T);
    clone(): Box<T>;
}
export declare const transform: <T, U, C extends {
    clone(): C;
}>(node: Node<T>, ctx: C, f: (ctx: C, data: T, childIndex: number) => U | undefined) => Node<U>;
export declare const walk: <T, C extends {
    clone(): C;
}>(node: Node<T>, ctx: C, f: (ctx: C, data: T, childIndex: number) => boolean | void) => void;
export interface PgnNodeData {
    san: string;
    startingComments?: string[];
    comments?: string[];
    nags?: number[];
}
export declare const makeOutcome: (outcome: Outcome | undefined) => string;
export declare const parseOutcome: (s: string | undefined) => Outcome | undefined;
export declare const makePgn: (game: Game<PgnNodeData>) => string;
export declare const defaultHeaders: () => Map<string, string>;
export declare const emptyHeaders: () => Map<string, string>;
export interface ParseOptions {
    stream: boolean;
}
export declare class PgnError extends Error {
}
export declare class PgnParser {
    private emitGame;
    private initHeaders;
    private maxBudget;
    private lineBuf;
    private budget;
    private found;
    private state;
    private game;
    private stack;
    private commentBuf;
    constructor(emitGame: (game: Game<PgnNodeData>, err: PgnError | undefined) => void, initHeaders?: () => Map<string, string>, maxBudget?: number);
    private resetGame;
    private consumeBudget;
    parse(data: string, options?: ParseOptions): void;
    private handleLine;
    private handleNag;
    private handleComment;
    private emit;
}
export declare const parsePgn: (pgn: string, initHeaders?: () => Map<string, string>) => Game<PgnNodeData>[];
export declare const parseVariant: (variant: string | undefined) => Rules | undefined;
export declare const makeVariant: (rules: Rules) => string | undefined;
export declare const startingPosition: (headers: Map<string, string>, opts?: FromSetupOpts) => Result<Position, FenError | PositionError>;
export declare const setStartingPosition: (headers: Map<string, string>, pos: Position) => void;
export type CommentShapeColor = 'green' | 'red' | 'yellow' | 'blue';
export interface CommentShape {
    color: CommentShapeColor;
    from: Square;
    to: Square;
}
export type EvaluationPawns = {
    pawns: number;
    depth?: number;
};
export type EvaluationMate = {
    mate: number;
    depth?: number;
};
export type Evaluation = EvaluationPawns | EvaluationMate;
export declare const isPawns: (ev: Evaluation) => ev is EvaluationPawns;
export declare const isMate: (ev: Evaluation) => ev is EvaluationMate;
export interface Comment {
    text: string;
    shapes: CommentShape[];
    clock?: number;
    emt?: number;
    evaluation?: Evaluation;
}
export declare const makeComment: (comment: Partial<Comment>) => string;
export declare const parseComment: (comment: string) => Comment;
