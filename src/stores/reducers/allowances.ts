export interface Allowance {
  url: string;
  enabled: boolean;
  limit: number;
  spent: number; // in winston
}

export interface IAllowancesAction {
  type:
    | 'TOGGLE_ALLOWANCE'
    | 'SET_LIMIT'
    | 'ADD_ALLOWANCE'
    | 'REMOVE_ALLOWANCE'
    | 'RESET_ALLOWANCE';
  payload: Partial<Allowance>;
}

export default function allowancesReducer(
  state: Allowance[] = [],
  action: IAllowancesAction
): Allowance[] {
  switch (action.type) {
    case 'ADD_ALLOWANCE':
      if (
        !action.payload.enabled ||
        !action.payload.limit ||
        !action.payload.url
      )
        break;

      // @ts-ignore
      return [...state, { ...action.payload, spent: 0 }];

    case 'SET_LIMIT':
      if (!action.payload.limit || !action.payload.url) break;
      return state.map((val) => ({
        ...val,
        limit:
          (action.payload.url === val.url ? action.payload.limit : val.limit) ??
          0.1
      }));

    case 'RESET_ALLOWANCE':
      if (!action.payload.url) break;
      return state.map((val) => ({
        ...val,
        spent: action.payload.url === val.url ? 0 : val.spent
      }));

    case 'TOGGLE_ALLOWANCE':
      if (action.payload.enabled === undefined || !action.payload.url) break;
      return state.map((val) => ({
        ...val,
        enabled:
          (action.payload.url === val.url
            ? action.payload.enabled
            : val.enabled) ?? true
      }));

    case 'REMOVE_ALLOWANCE':
      if (!action.payload.url) break;
      return state.filter((val) => val.url !== action.payload.url);
  }

  return state;
}
