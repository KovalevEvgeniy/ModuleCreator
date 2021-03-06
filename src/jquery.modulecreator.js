;(function ($) {
	$.CreateModule = function (props = {}) {
		class Tools {
			static run () {
				Tools.props = props;

				Tools.extendProps();
				Tools.makeLib();
			}

			static getCamelCase (name) {
				return name.substr(0,1).toLowerCase() + name.substr(1);
			}

			static makeLib () {
				$ = $ || {};
				$.fn = $.fn || {};

				$[lib] = $[lib] ? $[lib] : ($.fn[lib] = function () {
					let selector = this;
					if (typeof selector === 'function') {
						selector = $[lib].element || $('<div>');
						$[lib].element = selector;
					}

					const options = arguments[0];
					const args = Array.prototype.slice.call(arguments, 1);
					let result = selector;

					for (let i = 0; i < selector.length; i++) {
						let item = selector[i];

						if (typeof options === 'object' || typeof options === 'undefined') {
							if (typeof item[lib] !== 'object') {
								const inst = new Module(item, options);
								inst.list[inst.hash] = inst;
							}
						} else {
							if (item[lib][options] && typeof item[lib][options] === 'function') {
								result = (item[lib][options].apply(item[lib], args) || selector);
							} else {
								throw new Error('Method "' + options + '" is not defined in the "' + lib + '" module');
							}
						}
					}

					return result;
				});

				$[lib].struct = props;
			}

			static extendProps () {
				if (props.extends && props.extends.length > 0) {
					Tools.parents = {};
					Tools.parent = {};
					const parentsProps = props.extends.map(parentName => {
						parentName = Tools.getCamelCase(parentName);
						const parentStruct = $[parentName].struct;
						Tools.parents[parentName] = parentStruct.privateMethods;

						return parentStruct;
					});

					Tools.parentMethods = Tools.extend({}, ...parentsProps).privateMethods;
					props.parents = Tools.parents;
					props = Tools.extend({}, ...parentsProps, props);
				}
			}

			static extend (target = {}, ...objects) {
				objects.map(obj => {
					for (const key in obj) {
						if (obj.hasOwnProperty(key)) {
							const current = obj[key];

							if (typeof current === 'function') {
								target[key] = current;
							} else if (Array.isArray(current)) {
								target[key] = Tools.deepCopy(current);
							} else if (typeof current === 'object') {
								let clonedObject;

								if (Array.isArray(target[key])) {
									clonedObject = Tools.extend({}, current);
								} else if (typeof target[key] === 'object') {
									clonedObject = Tools.extend(target[key], current);
								} else {
									clonedObject = Tools.extend({}, current);
								}

								target[key] = clonedObject;
							} else {
								target[key] = current;
							}
						}
					}
				});

				return target;
			}

			static deepCopy (target) {
				if (typeof target === 'function') {
					return target;
				} else if (Array.isArray(target)) {
					return target.map(item => Tools.deepCopy(item));
				} else if (typeof target === 'object') {
					const clonedObject = Tools.extend({}, target);

					for (let key in clonedObject) {
						if (clonedObject.hasOwnProperty(key)) {
							clonedObject[key] = Tools.deepCopy(clonedObject[key]);
						}
					}

					return clonedObject;
				} else {
					return target;
				}
			}

			static haveFunctions (object) {
				for (let key in object) {
					if (object.hasOwnProperty(key) && typeof object[key] !== 'function') {
						throw new Error('The "' + key + '" element must be a function');
					}
				}
			}
		}

		class WatchingData {
			constructor (inst, data, watch) {
				this.inst = inst;
				this.watch = watch;
				this.data = {};
				this.instData = data;

				this.setData(data);
			}

			setData (data = {}) {
				const inst = this;

				for (let name in data) {
					if (data.hasOwnProperty(name)) {
						this.set(name, data[name], inst.watch[name]);
					}
				}

				Object.defineProperty(this.inst, 'data', {
					get: () => this.instData
				});
			}

			set (name, value, callback) {
				const inst = this;

				Object.defineProperty(this.instData, name, {
					get: () => {
						return inst.data[name];
					},
					set (newValue) {
						const oldValue = inst.data[name];

						inst.data[name] = newValue;

						if (callback && typeof callback === 'function') {
							callback.call(inst.inst, oldValue, inst.data[name]);
						} else if (inst.watch[name] && typeof inst.watch[name] === 'function') {
							inst.watch[name].call(inst.inst, oldValue, inst.data[name]);
						}
					}
				});

				inst.data[name] = value;
			}
		}

		class Factory {
			constructor (inst, options) {
				this.privateMethods = {};
				this.options = options;

				this.globalReg(inst);

				this.addHooks(inst);
				this.addSuperMethods(inst);
				this.addPrivateMethods(inst);
				this.addPublicMethods(inst);

				this.setData(inst);
				this.setOptions(inst);
			}

			globalReg (inst) {
				const storages = {storage, list};

				for (let key in storages) {
					Object.defineProperty(inst, key, {
						get: () => storages[key],
						set (val) {
							throw new Error('Setting the value to "' + val + '" failed. Object "' + key + '" is not editable');
						}
					});
				}
			}

			setData (inst) {
				const instData = Tools.extend({}, (props.data || {}), (this.options.data || {}));
				const watch = Tools.extend({}, (props.watch || {}), (this.options.watch || {}));
				Tools.haveFunctions(watch);

				watchingData = new WatchingData(inst, instData, watch);
			}

			setOptions (inst) {
				const hash = Math.round(new Date() * Math.random());
				const allDataSet = inst.el.dataset;
				const dataSet = allDataSet[lib];
				let optionsFromData = {};
				let optionsFromSingleData = {};

				if (Object.keys(allDataSet).length > 0) {
					for (const key in allDataSet) {
						if (key !== lib && key.indexOf(lib) === 0 && allDataSet.hasOwnProperty(key)) {
							const optionName = Tools.getCamelCase(key.split(lib)[1]);

							try {
								optionsFromSingleData[optionName] =  allDataSet[key] === '' ? true : JSON.parse(allDataSet[key]);
							} catch (error) {
								optionsFromSingleData[optionName] = allDataSet[key];
							}
						}
					}
				}

				try {
					optionsFromData = dataSet ? JSON.parse(dataSet) : {};
				} catch (error) {
					throw new Error('Check the data attributes in the element. ' + dataSet + ' is not valid JSON format.');
				}

				inst.hash = inst.el.hash = hash;
				const allOptions = Tools.extend(
					{},
					(props.options || {}),
					(this.options.options || {}),
					optionsFromData,
					optionsFromSingleData,
					{hash: hash}
				);

				const instOptions = {};
				for (const key in allOptions) {
					if (allOptions.hasOwnProperty(key)) {
						Object.defineProperty(instOptions, key, {
							set: (value) => {
								allOptions[key] = value;
							},
							get: () => {
								return inst._getOption(allOptions, key);
							}
						});
					}
				}

				Object.defineProperty(inst, 'options', {
					get: () => instOptions
				});
			}

			addHooks (inst) {
				const hooks = Tools.extend({
					beforeCreate: function () {},
					bindEvent: function () {},
					afterCreate: function () {}
				}, (props.hooks || {}), (this.options.hooks || {}));
				Tools.haveFunctions(hooks);

				Object.defineProperty(inst, 'hook', {
					get: () => (name, ...args) => {
						if (!hooks[name]) {
							throw new Error('Hook "' + name + '" is not defined in the module');
						}
						return hooks[name].apply(inst, args);
					}
				});
			}

			addPrivateMethods (inst) {
				if (props.privateMethods) {
					Tools.haveFunctions(props.privateMethods);

					for (let key in props.privateMethods) {
						if (props.privateMethods.hasOwnProperty(key)) {
							if (key[0] !== '_') {
								throw new Error('The name of the private method must begin with "_". Rename the method ' + key);
							}
							inst[key] = this.privateMethods[key] = props.privateMethods[key].bind(inst);
						}
					}
				}
			}

			addPublicMethods (inst) {
				inst.el[lib] = {
					data: inst.data,
					getStruct: () => inst._getStruct(),
					destroy: () => inst._destroy()
				};

				if (props.publicMethods) {
					Tools.haveFunctions(props.publicMethods);

					for (let key in props.publicMethods) {
						if (props.publicMethods.hasOwnProperty(key)) {
							const publicContext = {};
							Object.defineProperty(publicContext, 'inst', {
								get: () => inst.el[lib]
							});
							Object.defineProperty(publicContext, 'private', {
								get: () => this.privateMethods,
								set (val) {
									throw new Error('Setting the value to "' + val + '" failed. Object "private" is not editable');
								}
							});

							inst.el[lib][key] = props.publicMethods[key].bind(publicContext);

							if (inst[key]) {
								throw new Error('The ' + key + ' method is already defined in a private scope!');
							}
							if (key[0] === '_') {
								throw new Error('The public method should not start with "_". Rename the method ' + key);
							}
						}
					}
				}
			}

			addSuperMethods (inst, methods) {
				Tools.extend(inst.__proto__, Tools.parentMethods);

				Object.defineProperty(inst, 'super', {
					get: () => (function (name, argument, ...args) {
						try {
							if (props.parents && typeof props.parents[name] === 'object' && props.parents[name][argument]) {
								return props.parents[name][argument].apply(this, args);
							}
							return inst.__proto__[name].apply(this, [argument, ...args]);
						} catch (error) {
							throw new Error('Method "' + name + '" is not defined in the parents modules');
						}
					})
				});
			}
		}

		const name = props.name;
		const lib = Tools.getCamelCase(name);
		const list = {};
		const storage = {};
		let watchingData;
		Tools.run();

		class Module {
			constructor(el, options = {}) {
				const inst = this;

				inst.element = $(el);

				if (inst.element.length > 1) {
					inst.element.map(el => new $[name](el, options));
					return;
				}

				inst.el = el;

				new Factory(inst, options);

				inst.hook('beforeCreate');
				inst.hook('create');
				inst.hook('bindEvent');
				inst.hook('afterCreate');
			}

			_set (name, value, callback) {
				watchingData.set(name, value, callback);
			}

			_getEventList () {
				return {
					'click': 'touchend',
					'mouseenter': 'touchstart',
					'mousedown': 'touchstart',
					'mouseup': 'touchend',
					'mousemove': 'touchmove',
					'mouseleave': 'touchend'
				}
			}

			_getEventName (eventName, namespace) {
				namespace = (namespace ? '.' + namespace : '') + '.' + this.hash;

				if (this._isMobile()) {
					return ((this._getEventList()[eventName] || eventName) + namespace);
				} else {
					return (eventName + namespace);
				}
			}

			_isMobile () {
				return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
			}

			_destroy () {
				delete this.list[this.hash];
				delete this.el.hash;
				delete this.el[lib];
			}

			_getOption (options, key) {
				return options[key];
			}

			_extend (target = {}, ...objects) {
				return Tools.extend(target, ...objects);
			}

			_deepCopy (target) {
				return Tools.deepCopy(target);
			}
		}
	}
})(jQuery);
