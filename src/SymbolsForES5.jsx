(function() {

	'use strict';

	// If this is not an ES5 environment, we can't do anything.
	if (
		/* We'll at least need the following functions.
		 * While not exhaustive, this should be a good enough list to make sure
		 * we're in an ES5 environment.
		 */
		!Object.getOwnPropertyNames
		|| !Object.getOwnPropertyDescriptor
		|| !Object.defineProperty
		|| !Object.defineProperties
		|| !Object.keys
		|| !Object.create
		|| !Object.freeze
		|| !Object.isFrozen
		|| !Object.isExtensible
	) return;

	/* Retrieve the global object using an indirect eval.
	 * This should work in ES5 compliant environments.
	 * See: http://perfectionkills.com/global-eval-what-are-the-options/#indirect_eval_call_theory
	 */
	var _global = (0, eval)('this');

	// If Symbol is already defined, there's nothing to do.
	if (_global.Symbol) return;

	!!!includes('Secrets.jsx');

	_global.Symbol = Symbol;

})();