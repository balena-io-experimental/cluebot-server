import moment from 'moment';

/**
 * Generate a random integer between min and max, inclusive
 */
export const randIntFromInterval = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1) + min);

/**
 * Translates a Javascript Date object into a UTC timestamp in the format YYYY-MM-DDTHH:MM:SS+00:00
 */
export const toTimestamp = (time: Date | number) => moment(time).utc().format();

/**
 * Check if timestamp is newer than or equal to a week old.
 */
export const isNewerThan = (
	time: moment.Moment | string,
	count: number = 1,
	unit: 'weeks' | 'days' = 'weeks',
) => {
	const today = moment();
	const inputDate = moment(time);
	return today.subtract(count, unit).isSameOrBefore(inputDate);
};
