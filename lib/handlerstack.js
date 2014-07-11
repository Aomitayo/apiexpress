var debug = require('debug')('apiexpress.handlerstack');
var _ = require('lodash');

function HandlerStack(handler){
	this._pre = [];
	this._post = [];
	this._handlers = !!handler? Array.prototype.slice.call(arguments) : [];
}

HandlerStack.prototype.pre = function(fn){ this.use('pre', fn); return this;};

HandlerStack.prototype.post = function(fn){ this.use('post', fn); return this;};

HandlerStack.prototype.use = function(phase, fn){
	if(typeof phase === 'function' && !fn){
		fn = phase;
		phase = undefined;
	}
	if(typeof fn !== 'function'){
		throw new Error('HandlerStack middleware and handlers must be functions');
	}
	phase = phase || 'pre';
	this[phase].push(fn);
};

/**
 * Runs the stack of handlers
 * The last argument should always be a callback function
 * @return {void} 
 */
HandlerStack.prototype.run = function(){
	if(!this._handlers || this._handlers.length === 0){
		throw new Error('HandlerStack must have at least one handler before running');
	}
	var done = _.last(arguments);
	done = typeof done === 'function'? done : _.noop;
	var args = _.initial(arguments);

	function runStack(stack, err){
		if(stack.length === 0){
			done();
			return;
		}
		else if(err){
			done(err);
			return;
		}
		else{
			_.head(stack).apply(this, args.concat(_.partial(runStack, _.tail(stack))));
		}
	}

	var thisStack = this._pre.concat(this._handlers, this._post);

	runStack(thisStack);
};

module.exports = HandlerStack;