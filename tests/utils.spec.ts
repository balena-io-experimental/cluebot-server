import * as utils from '../src/utils';

describe('randIntFromInterval', () => {
	it('generates a random integer within interval when given positive inputs, inclusive', () => {
		const [min, max] = [0, 10];
		for (let i = 0; i < 10; i++) {
			const randInt = utils.randIntFromInterval(min, max);
			expect(randInt).toBeGreaterThanOrEqual(min);
			expect(randInt).toBeLessThanOrEqual(max);
		}
	});
});

describe('toTimestamp', () => {
	it('translates a UTC timestamp to the format YYYY-MM-DDThh:mm:ssZ', () => {
		// Expected timestamp example: 2021-10-13T06:05:44Z
		const UTCString = '2021-01-02T03:04:05Z';
		const dateFromUTC = new Date(UTCString);
		expect(utils.toTimestamp(dateFromUTC)).toBe(UTCString);

		// Should also take in a Date number, example: 1634105778932
		const dateNow = Date.now();
		expect(utils.toTimestamp(dateNow)).toMatch(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/i,
		);
	});
});

// Not writing tests for utils.isNewerThan as the internal methods
// use `moment` heavily. `moment` is very well tested.
