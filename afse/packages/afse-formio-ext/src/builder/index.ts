import { afseComponents } from '../components';

/**
 * Form builder sidebar group holding the AFSE components. Pass it under the
 * builder's `builder` option: `{ builder: { ...afseBuilderGroups } }`.
 */
export const afseBuilderGroups = {
  afse: {
    title: 'AFSE',
    weight: 0,
    default: true,
    components: Object.fromEntries(Object.keys(afseComponents).map((type) => [type, true])),
  },
};
