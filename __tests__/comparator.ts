/* globals afterEach,beforeEach,describe,expect,it,jest */

import { createComparator } from '../src/comparator';
import type { EqualityComparatorCreator } from '../src/comparator';

describe('createComparator', () => {
  it('should return a function', () => {
    const comparator = createComparator();

    expect(typeof comparator).toBe('function');
  });

  it('should default to a deep-equal setup when no equality comparator is provided', () => {
    const comparator = createComparator();

    const a = { foo: { bar: 'baz' } };
    const b = { foo: { bar: 'baz' } };

    expect(comparator(a, b)).toBe(true);
  });

  it('should use the custom comparator when one is provided', () => {
    const createIsEqual = () => (a: any, b: any) => a === b;

    const comparator = createComparator(createIsEqual);

    const a = { foo: { bar: 'baz' } };
    const b = { foo: { bar: 'baz' } };

    expect(comparator(a, b)).toBe(false);
  });

  it('should call the custom comparator with the correct params', () => {
    const customComparatorMock = jest.fn();
    const createIsEqual: EqualityComparatorCreator = (deepEqual) => (...args: [a: any, b: any, indexOrKeyA: any, indexOrKeyB: any, parentA: any, parentB: any, meta: any]) => {
      customComparatorMock(...args);
      const [a, b, , , , , meta] = args;
      return deepEqual(a, b, meta);
    };
    const comparator = createComparator(createIsEqual);

    const a = { foo: { bar: ['1', '2'], baz: new Set().add('x'), oof: new Map().set('y', 'yes') } };
    const b = { foo: { bar: ['1', '2'], baz: new Set().add('x'), oof: new Map().set('y', 'yes') } };

    const expectedParams: any = [
      [a.foo, b.foo, 'foo', 'foo', a, b, 'META'],
      [a.foo.oof, b.foo.oof, 'oof', 'oof', a.foo, b.foo, 'META'],
      ['y', 'y', 0, 0, a.foo.oof, b.foo.oof, 'META'], // called with the keys of a Map
      [a.foo.oof.get('y'), b.foo.oof.get('y'), 'y', 'y', a.foo.oof, b.foo.oof, 'META'],
      [a.foo.baz, b.foo.baz, 'baz', 'baz', a.foo, b.foo, 'META'],
      ['x', 'x', 'x', 'x', a.foo.baz, b.foo.baz, 'META'],
      [a.foo.bar, b.foo.bar, 'bar', 'bar', a.foo, b.foo, 'META'],
      [a.foo.bar[1], b.foo.bar[1], 1, 1, a.foo.bar, b.foo.bar, 'META'],
      [a.foo.bar[0], b.foo.bar[0], 0, 0, a.foo.bar, b.foo.bar, 'META'],
    ];

    comparator(a, b, 'META');
    expect(customComparatorMock.mock.calls).toEqual(expectedParams);
  });
});

it('should access Maps A and B values with keys', () => {
  const mapA = new Map([
    [{ foo: 'bar' }, 1],
    [{ foo: 'baz' }, 2],
  ]);
  const mapB = new Map([
    [{ foo: 'baz' }, 2],
    [{ foo: 'bar' }, 1],
  ]);

  const createIsEqual: EqualityComparatorCreator =
    (deepEqual) => (
      a: any,
      b: any,
      indexOrKeyA: any,
      indexOrKeyB: any,
      parentA: any,
      parentB: any,
      meta: any,
    ) => {
      if (typeof a === 'number' && typeof b === 'number') {
        // Ignores key equality comparison
        expect(parentA.get(indexOrKeyA)).toBe(a);
        expect(parentB.get(indexOrKeyB)).toBe(b);
      }

      return deepEqual(a, b, meta);
    };
  const comparator = createComparator(createIsEqual);
  comparator(mapA, mapB);
});

it('should provide correct iteration index when comparing Map keys', () => {
  const mapA = new Map([
    ['foo', 'bar'],
    ['oof', 'baz'],
  ]);
  const mapB = new Map([
    ['oof', 'baz'],
    ['foo', 'bar'],
  ]);

  const createIsEqual: EqualityComparatorCreator =
    (deepEqual) => (
      a: any,
      b: any,
      indexOrKeyA: any,
      indexOrKeyB: any,
      parentA: any,
      parentB: any,
      meta: any,
    ) => {
      if (typeof indexOrKeyA === 'number' && typeof indexOrKeyB === 'number') {
        // Only check key equality comparison
        expect(indexOrKeyA).toBe(Array.from(parentA.keys()).indexOf(a));
        expect(indexOrKeyB).toBe(Array.from(parentB.keys()).indexOf(b));
      }

      return deepEqual(a, b, meta);
    };
  const comparator = createComparator(createIsEqual);
  comparator(mapA, mapB);
});
