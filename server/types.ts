export type DatabaseModel = 'players' | 'answers';

export interface IPlayer {
	id: number;
	name: string;
	handle: string;
	is_playing: boolean | number;
}

export interface IQuestion {
	id: number;
	question: string;
	hint: string;
	last_asked: string;
}

export interface IAnswer {
	id: number;
	player_id: number;
	question_id: number;
	answer: string;
	votes: number;
	date_answered: string;
}

export type PickRename<T, K extends keyof T, R extends PropertyKey> = {
	[P in keyof T as P extends K ? R : P]: T[P];
};
