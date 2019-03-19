/**
* @ModuleCreator version 1.2.0
* @module TestName
* @plugin testName
* @example $.testName(object) || $('#example').testName(object)
* @author Kovalev Evgeniy
**/
const Test = {
	styles: {
		succes: 'color: #25a3ec',
		error: 'color: #d62020',
		life: 'color: #777'
	},
	log (message, type) {
		if (type === 'success') {
			console.log('%c 🔵 ' + message, this.styles.succes)
		} else if (type === 'error') {
			console.log('%c 🔴 ' + message, this.styles.error)
		} else if (type === 'life') {
			console.log('%c ⚫️ ' + message, this.styles.life)
		}
	}
};

$(function () {
	$.CreateModule({
		name: 'TestName',
		data: {},
		options: {},
		hooks: {
			beforeCreate: function () {console.log('%c' + 'Life cycle: beforeCreate', this.options.lifeStyle)},
			create: function () {
				Test.log(`Life cycle: create`, 'life')
				this._init()
			},
			bindEvent: function () {
				Test.log(`Life cycle: bindEvent`, 'life')
				$(this.element).on(this._getEventName('click', this.hash), this._testClick)
				$(this.element).trigger('click')
			},
			afterCreate: function () {
				Test.log(`Life cycle: afterCreate`, 'life')
			},
			customHook: function () {
				Test.log(`Hook is working`, 'success')
			}
		},
		privateMethods: {
			_init: function () {
				if (this.options.exampleOption) {
					console.log('base initing')
				}
				this._tests()
			},
			_getEventList: function () {
				return $.extend({}, this.super('_getEventList'), {
					'myEvent': 'myMobileEvent'
				})
			},
			_onClick: function (e) {
				// this - инст модуля
				var element = $(e.currentTarget)
				console.log('anithing code')
			},
			_examplePrivateMethod: function () {
				var element = this.element
				console.log('private code');
			},
			_tests: function () {
				console.log('Tests:');

				this._testHook()
				this._testEditable('storage')
				this._testEditable('list')
				this._testEditable('data')
				this._testEditable('options')
			},
			_testHook: function () {
				try {
					this.hook('customHook')
				} catch (err) {
					Test.log(`Hook dont working`, 'error')
				}
			},
			_testEditable: function (name) {
				console.log(name + ':');
				let isEditableObject = false
				let isRewritableProp = false
				try {
					this[name] = 'test string';
				} catch (err) {}

				if (typeof this[name] === 'object') {
					this[name].test = 'test string';
					if (typeof this[name].test === 'string') {
						isRewritableProp = true
					}
				} else {
					isEditableObject = true
				}

				if (isEditableObject) {
					Test.log(`Object "${name}" is editable`, 'error')
				} else {
					Test.log(`Object "${name}" is not editable`, 'success')
				}

				if (isRewritableProp) {
					Test.log(`Object "${name}" properties rewritable`, 'success')
				} else {
					Test.log(`Object "${name}" is not properties rewritable`, 'error')
				}
			},
			_testClick: function (e) {
				if (e.type === 'click') {
					console.log('Event: ' + true);
				}
			}
		},
		publicMethods: {
			test: function (e) {
				try {
					this.private = 'test string';
				} catch (err) {
					Test.log(`Object "private" is not editable`, 'success')
				}

				if (typeof this.private === 'object') {
					if (this.private && this.private._tests) {
						Test.log(`Private methods are available from the public method`, 'success')
					} else {
						Test.log(`Private methods are not available from the public method`, 'error')
					}
				} else {
					Test.log(`Object "private" is editable`, 'error')
				}
			}
		}
	});
});

$(function() {
	$('#example').testName()
	$('#example').testName('test')
})