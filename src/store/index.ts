import { Move } from '@/components/Move';
import { Point } from '@/components/Point';
import { SquareState } from '@/components/SquareState';
import { Store as VuexStore, createStore, MutationTree, ActionContext, ActionTree, GetterTree, CommitOptions, DispatchOptions, createLogger } from 'vuex';

export type State = { currentMoveNumber: number; moves: Move[]; board: SquareState[][] };

//set state
const state: State = {
  currentMoveNumber: -1, //-1 => no moves
  moves: [],
  board: []
};

// mutations and action enums

export enum MutationTypes {
  SET_CURRENT_MOVE_NUMBER = "SET_CURRENT_MOVE_NUMBER",
  EMPTY_MOVE_HISTORY = "EMPTY_MOVE_HISTORY",
  DROP_MOVES_AFTER_NOW = "DROP_MOVES_AFTER_NOW",
  PUSH_MOVE_TO_HISTORY = "PUSH_MOVE_TO_HISTORY",
  GO_TO_MOVE_NUMBER = "GO_TO_MOVE_NUMBER",

  SET_SQUARE_STATE = "SET_SQUARE_STATE",
  SET_EMPTY_BOARD = "SET_EMPTY_BOARD",
  SET_CURRENT_MOVE = "SET_CURRENT_MOVE"
}








export enum ActionTypes {
  SET_CURRENT_MOVE_NUMBER = "SET_CURRENT_MOVE_NUMBER",
  RESET_MOVE_HISTORY = "RESET_MOVE_HISTORY",
  MAKE_MOVE_ON_HISTORY = "MAKE_MOVE_ON_HISTORY",
  INCREASE_MOVE_NUMBER = "INCREASE_MOVE_NUMBER",
  DECREASE_MOVE_NUMBER = "DECREASE_MOVE_NUMBER"
}


//Mutation Types
export type Mutations<S = State> = {
  [MutationTypes.SET_CURRENT_MOVE_NUMBER](state: S, payload: number): void;
  [MutationTypes.EMPTY_MOVE_HISTORY](state: S): void;
  [MutationTypes.DROP_MOVES_AFTER_NOW](state: S): void;
  [MutationTypes.PUSH_MOVE_TO_HISTORY](state: S, payload: Move): void;
  [MutationTypes.SET_CURRENT_MOVE](state: S, payload: Move): void;
  [MutationTypes.GO_TO_MOVE_NUMBER](state: S, payload: number): void;
  [MutationTypes.SET_SQUARE_STATE](state: S, payload: { point: Point; squareState: SquareState }): void;
  [MutationTypes.SET_EMPTY_BOARD](state: S): void;
};

//define mutations
const mutations: MutationTree<State> & Mutations = {
  [MutationTypes.SET_CURRENT_MOVE_NUMBER](state: State, payload: number) {
    state.currentMoveNumber = payload
  },
  [MutationTypes.EMPTY_MOVE_HISTORY](state: State) {
    state.moves = []
  },
  [MutationTypes.DROP_MOVES_AFTER_NOW](state: State) {
    state.moves = state.moves.slice(0, state.currentMoveNumber + 1)
  },
  [MutationTypes.PUSH_MOVE_TO_HISTORY](state: State, payload: Move) {
    state.moves.push(payload)
  },
  [MutationTypes.SET_CURRENT_MOVE](state: State, payload: Move) {
    state.moves[state.currentMoveNumber] = payload
  },

  [MutationTypes.GO_TO_MOVE_NUMBER](state: State, payload: number) {
    state.currentMoveNumber = payload
  },
  [MutationTypes.SET_SQUARE_STATE](state: State, payload: { point: Point; squareState: SquareState }) {
    state.board[payload.point.y][payload.point.x] = payload.squareState;
  },
  [MutationTypes.SET_EMPTY_BOARD](state: State) {
    const board = [] as SquareState[][]
    for (let i = 0; i < 10; i++) {
      board[i] = [];
      for (let j = 0; j < 10; j++) {
        board[i][j] = SquareState.Empty
      }
    }
    state.board = board;
  },
};


//actions

type AugmentedActionContext = {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1]
  ): ReturnType<Mutations[K]>;

  commit<K extends keyof Mutations>(
    key: K,
  ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, State>, "commit">;

// actions interface

export interface Actions {
  [ActionTypes.SET_CURRENT_MOVE_NUMBER](
    { commit }: AugmentedActionContext,
    payload: number
  ): void;
  [ActionTypes.RESET_MOVE_HISTORY](
    { commit }: AugmentedActionContext
  ): void;
  [ActionTypes.INCREASE_MOVE_NUMBER](
    { commit }: AugmentedActionContext
  ): void;
  [ActionTypes.DECREASE_MOVE_NUMBER](
    { commit }: AugmentedActionContext
  ): void;
  [ActionTypes.MAKE_MOVE_ON_HISTORY](
    { commit }: AugmentedActionContext,
    payload: Move
  ): void;
}

export const actions: ActionTree<State, State> & Actions = {
  [ActionTypes.SET_CURRENT_MOVE_NUMBER]({ commit }, payload: number) {
    commit(MutationTypes.SET_CURRENT_MOVE_NUMBER, payload);
  },
  [ActionTypes.RESET_MOVE_HISTORY]({ commit }) {
    commit(MutationTypes.EMPTY_MOVE_HISTORY);
    commit(MutationTypes.SET_CURRENT_MOVE_NUMBER, -1);
  },
  [ActionTypes.INCREASE_MOVE_NUMBER]({ commit }) {
    commit(MutationTypes.SET_CURRENT_MOVE_NUMBER, state.currentMoveNumber + 1);
  },
  [ActionTypes.DECREASE_MOVE_NUMBER]({ commit }) {
    commit(MutationTypes.SET_CURRENT_MOVE_NUMBER, state.currentMoveNumber - 1);
  },
  [ActionTypes.MAKE_MOVE_ON_HISTORY]({ commit }, payload: Move) {
    commit(MutationTypes.SET_CURRENT_MOVE_NUMBER, state.currentMoveNumber + 1);
    if (state.currentMoveNumber == state.moves.length) {
      commit(MutationTypes.PUSH_MOVE_TO_HISTORY, payload);
    }
    else {
      commit(MutationTypes.SET_CURRENT_MOVE, payload);
      commit(MutationTypes.DROP_MOVES_AFTER_NOW);
    }
  },
};

// Getters types
export type Getters = {
  currentMoveNumber(state: State): number;
  currentMove(state: State): Move;
  moves(state: State): Move[];
  squareStateByPoint(state: State): (p: { x: number; y: number }) => SquareState;
  board(state: State): SquareState[][];
};

//getters

export const getters: GetterTree<State, State> & Getters = {
  currentMoveNumber: state => {
    return state.currentMoveNumber;
  },
  currentMove: state => {
    return state.moves[state.currentMoveNumber];
  },
  moves: state => {
    return state.moves;
  },
  squareStateByPoint: state => (p: { x: number; y: number }) => {
    return state.board[p.y][p.x]
  },
  board: state => {
    return state.board
  }
};

//setup store type
export type Store = Omit<
  VuexStore<State>,
  "commit" | "getters" | "dispatch"
> & {
  commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
    key: K,
    payload: P,
    options?: CommitOptions
  ): ReturnType<Mutations[K]>;
  commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
    key: K,
    options?: CommitOptions
  ): ReturnType<Mutations[K]>;
} & {
  getters: {
    [K in keyof Getters]: ReturnType<Getters[K]>;
  };
} & {
  dispatch<K extends keyof Actions>(
    key: K,
    payload: Parameters<Actions[K]>[1],
    options?: DispatchOptions
  ): ReturnType<Actions[K]>;
  dispatch<K extends keyof Actions>(
    key: K,
    options?: DispatchOptions
  ): ReturnType<Actions[K]>;
};

const isDevEnvironment = process.env.NODE_ENV === 'development'
export const store = createStore({
  state,
  mutations,
  actions,
  getters,
  plugins: isDevEnvironment ? [createLogger()] : []
});

export function useStore() {
  return store as Store;
}