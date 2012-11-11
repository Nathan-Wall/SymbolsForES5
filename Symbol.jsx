var Symbol = (function() {

	function Symbol(/* params */) {
		// TODO: I think some of the code that's intended to make Symbol work should be pulled
		// out of Secrets and put here instead ... such as the Object.prototype[SECRET_KEY] getter
		// and the handling of freezable.

		Secrets(this).set('id', '!Y:' + Secrets.getIdentifier());

	}

	Object.defineProperties(Symbol.prototype, {

		toString: {
			value: function() {
				var S = Secrets(this);
				Secrets.prepName(S.get('id'), this.freezable);
				return Secrets.SECRET_KEY;
			},
			enumerable: false,
			writable: true,
			configurable: true
		},

		// We can't simulate "delete obj[symbol]" in ES5. So we'll have to resort to
		// "symbol.deleteFrom(obj)" in this situation.
		deleteFrom: {
			value: function(obj) {
				var S = Secrets(obj), T = Secrets(this);
				if (!S || !T) return false;
				return S.delete(T.get('id'), this.freezable);
			},
			enumerable: false,
			writable: true,
			configurable: true
		},

		// We also can't simulate "symbol in obj" in ES5. So we'll have to resort to
		// "symbol.isIn(obj)" in this situation.
		isIn: {
			value: function(obj) {
				var S = Secrets(obj), T = Secrets(this);
				if (!S || !T) return false;
				return S.has(T.get('id'));
			},
			enumerable: false,
			writable: true,
			configurable: true
		},

		freezable: {
			value: true,
			enumerable: false,
			writable: true,
			configurable: true
		}

	});

	Object.defineProperties(Symbol, {
		'__useDeleteFrom__': {
			value: true,
			enumerable: false,
			writable: true,
			configurable: true
		},
		'__useIsIn__': {
			value: true,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});

	return Symbol;

})();