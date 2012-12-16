var Symbol = (function() {

	function Symbol(/* params */) {
		// TODO: I think some of the code that's intended to make Symbol work should be pulled
		// out of Secrets and put here instead ... such as the Object.prototype[SECRET_KEY] getter.

		Secrets(this).set('id', '!Y:' + Secrets.getIdentifier());

	}

	// Not sure if the spec will have this property locked, but it's being locked here for
	// security reasons so that a symbol's toString can't be changed.
	Object.defineProperty(Symbol, 'prototype', {
		value: Symbol.prototype,
		writable: false,
		configurable: false
	});

	Object.defineProperties(Symbol.prototype, {

		// Note: Due to this required toString behavior, shimmed Symbols cannot implement any
		// specified toString method.
		toString: {
			value: function() {
				var S = Secrets(this);
				Secrets.prepName(S.get('id'), true);
				return Secrets.SECRET_KEY;
			},
			enumerable: false,
			// This property is locked for added security.
			writable: false,
			configurable: false
		}

	});

	Object.defineProperties(Symbol, {

		// We can't simulate `delete obj[symbol]` in ES5. So we'll have to resort to
		// `Symbol.__deleteSymbol__(obj, symbol)` in this situation.
		__deleteSymbol__: {
			value: function __deleteSymbol__(obj, $symbol) {

				if (!($symbol instanceof Symbol))
					throw new TypeError('Symbol expected.');

				var S = Secrets(obj), T = Secrets($symbol);

				if (!S || !T)
					return false;

				return S.delete(T.get('id'), true);

			},
			enumerable: false,
			writable: false,
			configurable: false
		},

		// We also can't simulate `symbol in obj` in ES5. So we'll have to resort to
		// `Symbol.__hasSymbol__(obj, symbol)` in this situation.
		__hasSymbol__: {
			value: function __hasSymbol__(obj, $symbol) {

				if (!($symbol instanceof Symbol))
					throw new TypeError('Symbol expected.');

				var S = Secrets(obj), T = Secrets($symbol);

				if (!S || !T)
					return false;

				return S.has(T.get('id'));

			},
			enumerable: false,
			writable: false,
			configurable: false
		}

	});

	return Symbol;

})();