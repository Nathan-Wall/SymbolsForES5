var Secrets = (function(Object) {
	// TODO: Correct this comment to say two paths -- now also through new Symbol().toString().
	/* There is one known path for retrieval of the secretKey: using an iframe's getOwnPropertyNames method.
	 * Therefore, this implementation has a second layer of protection, the locked variable. The secret map
	 * may only be retrieved when locked is set to false, and it can only be set internally.
	 * The overriding of getPropertyNames, etc. should not be considered a security measure (the locked variable
	 * is the security measure), but instead compatibility measures -- it ensures that scripts which don't expect
	 * secretKey won't encounter except for in the extreme case of the use of a cross-frame getOwnPropertyNames.
	 */

	var lazyBind = Function.prototype.bind.bind(Function.prototype.call),

		// ES5 functions
		create = Object.create,
		getPrototypeOf = Object.getPrototypeOf,
		isExtensible = Object.isExtensible,
		isFrozen = Object.isFrozen,
		freeze = Object.freeze,
		keys = Object.keys,
		getOwnPropertyNames = Object.getOwnPropertyNames,
		getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
		defineProperty = Object.defineProperty,
		hasOwnProperty = lazyBind(Object.prototype.hasOwnProperty),
		push = lazyBind(Array.prototype.push),
		forEach = lazyBind(Array.prototype.forEach),
		filter = lazyBind(Array.prototype.filter),
		fromCharCode = String.fromCharCode,

		// ES Harmony functions
		getPropertyNames = Object.getPropertyNames,

		// ES.next strawman functions
		getPropertyDescriptors = Object.getPropertyDescriptors,
		getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors,

		// ES Harmony constructors
		_Proxy = typeof Proxy == 'undefined' ? undefined : Proxy,

		// A property name can be prepped to be exposed when object[secretKey] is accessed.
		preppedName,
		freezable = true,

		// Determines whether object[secretKey] on an object which doesn't have a secretKey property
		// should define itself. This is turned off when checking the prototype chain.
		autoDefine = true,

		// Determines whether object[secretKey] should expose the secret map.
		locked = true,

		random = getRandomGenerator(),
		// idNum will ensure identifiers are unique.
		idNum = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		preIdentifier = randStr(7) + '0',
		secretKey = '!S:' + getIdentifier();

	(function() {
		// Override get(Own)PropertyNames and get(Own)PropertyDescriptors

		var overrides = {
			getOwnPropertyNames: getOwnPropertyNames
		};

		if (getPropertyNames) overrides.getPropertyNames = getPropertyNames;

		keys(overrides).forEach(function(u) {
			var original = overrides[u];
			defineProperty(Object, u, {
				value: function(obj) {
					return filter(original.apply(this, arguments), function(u) {
						return u != secretKey;
					});
				},
				enumerable: false,
				writable: true,
				configurable: true
			});
		});

		overrides = { };

		if (getPropertyDescriptors) overrides.getPropertyDescriptors = getPropertyDescriptors;
		if (getOwnPropertyDescriptors) overrides.getOwnPropertyDescriptors = getOwnPropertyDescriptors;

		keys(overrides).forEach(function(u) {
			var original = overrides[u];
			defineProperty(Object, u, {
				value: function(obj) {
					var desc = original.apply(this, arguments);
					if (desc[secretKey]) delete desc[secretKey];
					return desc;
				},
				enumerable: false,
				writable: true,
				configurable: true
			});
		});

	})();

	// Override functions which prevent extensions on objects to go ahead and add a secret map first.
	[ 'preventExtensions', 'seal', 'freeze' ].forEach(function(u) {
		var original = Object[u];
		defineProperty(Object, u, {
			value: function(obj) {
				// Define the secret map.
				Secrets(obj);
				return original.apply(this, arguments);
			}
		});
	});

	if (typeof _Proxy == 'function') {

		Proxy = (function() {
			/* TODO: This works for "direct_proxies", the current ES6 draft; however, some browsers have
			 * support for an old draft (such as FF 17 and below) which uses Proxy.create(). Should this
			 * version be overridden to protect against discovery of secretKey on these browsers also?
			 */

			var trapBypasses = {
				defineProperty: defineProperty,
				hasOwn: hasOwnProperty,
				get: function(target, name) { return target[name]; }
			};

			return function Proxy(target, traps) {

				if (!(this instanceof Proxy)) {
					// TODO: The new keyword wasn't used. What should be done?
					return new Proxy(target, traps);
				}

				var _traps = create(traps);

				keys(trapBypasses).forEach(function(trapName) {
					var bypass = trapBypasses[trapName];
					if (typeof traps[trapName] == 'function') {
						// Override traps which could discover secretKey.
						_traps[trapName] = function(target, name) {
							if (name === secretKey) {
								// Bypass any user defined trap when name === secretKey.
								return bypass.apply(null, arguments);
							}
							return traps[trapName].apply(this, arguments);
						};
					}
				});

				return new _Proxy(target, _traps);
			};

		})();

	} else if (_Proxy && _Proxy.create) {

//		Proxy.create = (function() {
//
//			return function create(traps, proto) {
//				// TODO
//			};
//
//		})();

	}

	// Allow Symbol properties to be accessed as keys.
	// Note: this monkey patch prevents Object.prototype from having its own secretMap.
	// Therefore, Secrets(Object.prototype) will fail.
	defineProperty(Object.prototype, secretKey, {

		get: function() {
			if(this === Object.prototype) return;
			var value = Secrets(this, preppedName);
			preppedName = undefined;
			return value;
		},

		set: function(value) {
			Secrets(this);
			this[secretKey] = value;
		},

		enumerable: false,
		configurable: false

	});

	// Override hasOwnProperty to work with preppedNames.
	defineProperty(Object.prototype, 'hasOwnProperty', {

		value: function _hasOwnProperty(name) {

			var N = String(name),
				value;

			if (N == secretKey) {

				if (locked) {
					if (!preppedName) return false;
					value = Secrets(this).hasOwn(preppedName);
					preppedName = undefined;
					return value;
				}

				return hasOwnProperty(this, secretKey);

			} else return hasOwnProperty(this, name);

		},

		enumerable: false,
		writable: true,
		configurable: true

	});

	var methods = {

		set: function setSecretProperty(O, name, value) {

			// Prevent secret properties from disobeying Object.freeze and Object.preventExtensions
			// unless freezable is false.
			if (!permitChange(this, O, name, true))
				throw new TypeError('Can\'t set property; object is frozen or not extensible.');

			locked = false;
			O[secretKey][name] = value;

			return value;

		},

		get: function getSecretProperty(O, name) {
			var secretMap, secretProp;
			name = String(name);
			// Turn off autoDefine because we'll be checking the prototype chain
			autoDefine = false;
			do {
				locked = false;
				secretMap = O[secretKey];
				// We check in case the prototype doesn't have a secret map.
				secretProp = secretMap && secretMap[name];
				if (secretProp) {
					autoDefine = true;
					return secretProp;
				}
			} while (O = getPrototypeOf(O));
			autoDefine = true;
		},

		getOwn: function getOwnSecretProperty(O, name) {
			locked = false;
			return O[secretKey][name];
		},

		has: function hasSecretProperty(O, name) {
			// Doesn't use get because can't distinguish between value *set* to undefined and unassigned.
			var secretMap;
			name = String(name);
			// Turn off autoDefine because we'll be checking the prototype chain
			autoDefine = false;
			do {
				locked = false;
				secretMap = O[secretKey];
				if (secretMap && name in secretMap) {
					autoDefine = true;
					return true;
				}
			} while (O = getPrototypeOf(O));
			autoDefine = true;
			return false;
		},

		hasOwn: function hasOwnSecretProperty(O, name) {
			locked = false;
			return name in O[secretKey];
		},

		delete: function deleteSecretProperty(O, name, _freezable) {
			freezable = _freezable;
			if (!permitChange(this, O, name, true))
				throw new TypeError('Can\'t delete property from ' + O);
			locked = false;
			return delete O[secretKey][name];
		}

	};

	defineProperty(Secrets, 'version', {
		value: freeze({
			major: 1,
			minor: 1,
			revision: 0,
			alpha: true
		}),
		enumerable: true
	});

	extend(Secrets, {

		// Note to users of this library:
		// Consider deleting the following properties if they are not used by the outside.

		secretKey: secretKey,

		prepName: function prepName(name, _freezable) {
			// Allows one access to Secrets(object).get(preppedName)
			// via object[secretKey] while in locked mode.
			freezable = _freezable;
			preppedName = String(name);
		},

		getIdentifier: getIdentifier,

		toString: function toString() {
			return '[ Secrets '
				+ [
					Secrets.version.major, Secrets.version.minor, Secrets.version.revision
				].join('.')
				+ ' ]';
		}

	});

	return Secrets;

	function Secrets(O, name) {
		if(O === Object.prototype) return;
		if (O !== Object(O)) throw new Error('Not an object: ' + O);
		if (!hasOwnProperty(O, secretKey)) {
			if (!isExtensible(O)) return;
			defineProperty(O, secretKey, {

				get: (function() {
					var secretMap = create(
						// Prevent the secret map from having a prototype chain.
						null,
						{
							Secrets: { value: preloadMethods(methods, O) }
						}
					);
					return function getSecret() {
						var value;
						// The lock protects against retrieval in the event that the secretKey is found.
						if (locked) {
							if (!preppedName) return;
							value = secretMap.Secrets.get(preppedName);
							preppedName = undefined;
							return value;
						}
						locked = true;
						return secretMap;
					};
				})(),

				set: function setSecret(value) {
					// Weird Chrome behavior where getOwnPropretyNames seems to call object[key] = true...
					// Let's ignore it.
					if(preppedName === undefined) return;
					var ret;
					locked = false;
					ret = this[secretKey].Secrets.set(preppedName, value);
					preppedName = undefined;
					return ret;
				},

				enumerable: false,
				configurable: false

			});
		}
		locked = false;
		if (name) return O[secretKey].Secrets.get(name);
		return O[secretKey].Secrets;
	}

	function getIdentifier() {
		var range = 125 - 65, idS = '';
		idNum[0]++;
		for(var i = 0; i < idNum.length; i++) {
			if (idNum[i] > range) {
				idNum[i] = 0;
				if (i < idNum.length) idNum[i + 1]++;
				else idNum = idNum.map(function() { return 0; });
			}
			idS += encodeStr(idNum[i]);
		}
		return preIdentifier + ':' + getRandStrs(8, 11).join('/') + ':' + idS;
	}

	function permitChange(methods, O, name, checkExtensible) {
		var _freezable = freezable;
		freezable = true;
		return !(_freezable && (
				isFrozen(O)
				|| checkExtensible && !isExtensible(O) && !methods.hasOwn(name)
			));
	}

	function encodeStr(num) {
		return fromCharCode(num + 65);
	}

	function getRandStrs(count, length) {
		var r = [ ];
		for(var i = 0; i < count; i++) {
			push(r, randStr(length));
		}
		return r;
	}

	function randStr(length) {
		var s = '';
		for (var i = 0; i < length; i++) {
			s += encodeStr(random() * (125 - 65 + 1));
		}
		return s;
	}

	function getRandomGenerator() {
		var getRandomValues
			= typeof crypto != 'undefined' && crypto != null
				? (function() {
					var f = crypto.random || crypto.getRandomValues;
					if (f) return f.bind(crypto);
					return undefined;
				})()
				: undefined;
		if (getRandomValues) {
			// Firefox (15 & 16) seems to be throwing a weird "not implemented" error on getRandomValues.
			// Not sure why?
			try { getRandomValues(new UIntArray(4)); }
			catch(x) { getRandomValues = undefined }
		}
		if (typeof getRandomValues == 'function' && typeof Uint8Array == 'function') {
			return (function() {
				var values = new Uint8Array(4), index = 4;
				return function random() {
					if (index >= values.length) {
						getRandomValues(values);
						index = 0;
					}
					return values[index++] / 256;
				};
			})();
		} else return Math.random;
	}

	function preloadMethods(methods, arg) {
		var bound = Object.create(null);
		keys(methods).forEach(function(method) {
			bound[method] = methods[method].bind(bound, arg);
		});
		return bound;
	}

	function extend(extendWhat, extendWith) {
		forEach(keys(extendWith), function(key) {
			defineProperty(extendWhat, key, getOwnPropertyDescriptor(extendWith, key));
		});
	}

// We pass in Object to ensure that it cannot be changed later to something else.
})(Object);