import { Action } from '../lib/Action';
import { Monogatari } from '../monogatari';
import { Util } from '@aegis-framework/artemis';

export class Conditional extends Action {

	static setup () {
		Monogatari.history ('conditional');
	}

	static matchObject (statement) {
		return typeof statement.Conditional !== 'undefined';
	}

	constructor (statement) {
		super ();
		this.statement = statement.Conditional;
	}

	apply () {
		return new Promise ((resolve) => {

			// Call the condition function. Since the function might use a
			// Promise.reject () to return as false, we also define a catch
			// block to run the False branch of the condition.
			Util.callAsync (this.statement.Condition, Monogatari).then ((returnValue) => {

				Monogatari.global ('block', false);

				// Check if the function returned true so we run the True branch
				// of the conditional. If false is returned, we run the False
				// branch of the conditional and if a string is returned, we use
				// it as a key so we run the branch that has that key
				if (returnValue === true) {
					Monogatari.run (this.statement.True, false);
					Monogatari.history ('conditional').push ('True');
				} else if (typeof returnValue === 'string') {
					Monogatari.run (this.statement[returnValue], false);
					Monogatari.history ('conditional').push (returnValue);
				} else {
					Monogatari.run (this.statement.False, false);
					Monogatari.history ('conditional').push ('False');
				}
			}).catch (() => {
				Monogatari.global ('block', false);
				Monogatari.run (this.statement.False, false);
				Monogatari.history ('conditional').push ('False');
			}).finally (() => {
				resolve ();
			});
		});
	}

	willRevert () {
		if (Monogatari.history ('conditional').length > 0) {
			const conditional = Monogatari.history ('conditional')[Monogatari.history ('conditional').length - 1];
			if (this.statement[conditional] !== 'undefined') {
				return Promise.resolve ();
			}
		}
		return Promise.reject ();
	}

	revert () {
		const conditional = Monogatari.history ('conditional')[Monogatari.history ('conditional').length - 1];
		return Monogatari.revert (this.statement[conditional], false);
	}

	didRevert () {
		Monogatari.history ('conditional').pop ();
		return Promise.resolve ({ advance: false, step: false });
	}
}

Conditional.id = 'Conditional';

Monogatari.registerAction (Conditional, true);