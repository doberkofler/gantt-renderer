import {describe, expect, it} from 'vitest';
import {createPixelMapper} from './pixelMapper.ts';

describe('pixelMapper utilities', () => {
	it('converts date to x and back consistently', () => {
		const origin = new Date('2026-01-01T00:00:00.000Z');
		const mapper = createPixelMapper('day', origin);
		const target = new Date('2026-01-04T00:00:00.000Z');
		const x = mapper.toX(target);
		expect(x).toBe(72 * 3);
		expect(mapper.toDate(x).toISOString()).toBe(target.toISOString());
	});

	it('converts duration width and back', () => {
		const mapper = createPixelMapper('week', new Date('2026-01-01T00:00:00.000Z'));
		const width = mapper.durationToWidth(336);
		expect(width).toBe(240);
		expect(mapper.widthToDuration(width)).toBe(336);
	});
});
