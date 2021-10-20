import moment from 'moment';

/**
 * Generate a random integer between min and max, inclusive
 */
export const randIntFromInterval = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1) + min);

/**
 * Translates a Javascript Date object into a UTC timestamp in the format YYYY-MM-DDTHH:MM:SS+00:00
 *
 * NOTE that Moment truncates milliseconds.
 */
export const toTimestamp = (time: Date | number): string =>
	moment(time).utc().format();
