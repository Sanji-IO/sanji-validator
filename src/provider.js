/*globals angular*/
(function() {
  'use strict';

  angular.module('sanji.validator.provider', ['sanji.validator.value'])
  .provider('sanjiValidatorConfig', function() {

    var self, config, setup, $injector,
        $rootScope, $q, $timeout, _;

    self = this;
    config = {};
    config.validators = {};
    config.validMethod = 'watch';

    setup = function (injector) {
      $injector = injector;
      $q = $injector.get('$q');
      $timeout = $injector.get('$timeout');
      $rootScope = $injector.get('$rootScope');
      _ = $injector.get('_');
    };

    self.isReservedRule = function(name) {
      return -1 !== ['range'].indexOf(name);
    };

    self.extractVarFromFunc = function(func) {

      var FN_ARGS, args;

      FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

      args = func.toString()
        .match(FN_ARGS)[1].split(/,/);

      args = _.map(args, function(arg) {
        return arg.replace(/^\s+|\s+$/g, '');
      });

      return args;
    };

    self.runReservedRule = function(rule, value, attrs) {

      var args, scope;

      scope = {};
      args = self.extractVarFromFunc(rule);

      scope.value = value;

      _.each(attrs, function(value, property) {
        // skip value
        if ('value' === property) {
          return true;
        }
        if (-1 !== args.indexOf(property)) {
          scope[property] = value;
        }
      });

      return rule.apply(this, _.pluck(scope));
    };

    self.setValidMethod = function(method) {
      config.validMethod = method;
    };

    self.getValidMethod = function() {
      return config.validMethod;
    };

    self.setValidators = function(rows) {
      angular.extend(config.validators, rows);
      $rootScope.$broadcast('sanji::validators::change');
    };

    self.getValidators = function() {
      return config.validators;
    };

    self.getValidatorsByNames = function(names) {

      var allValidators, validators;

      allValidators = self.getValidators();
      validators = [];

      _.each(names, function(name) {

        var validator;

        name = name.replace(/^\s+|\s+$/g, '');
        validator = allValidators[name];

        if (! validator) {
          throw new Error('validator ' + name + ' not found.');
        }
        validator.name = name;
        validators.push(validator);
      });

      return validators;
    };

    self.setCustomErrorHtml = function(html) {
      config.customCustomErrorHtml = html;
    };

    self.getCustomErrorHtml = function() {
      return config.customCustomErrorHtml;
    };

    self.getErrorHtml = function(message) {
      return '<p class="validation-invalid">' + message + '</p>';
    };

    self.isRegExp = function(obj) {
      return (RegExp === obj.constructor);
    };

    self.validate = function(scope, form) {

      form.hasSetFocus = false;

      for (var k in form) {
        if (form[k] && form[k].hasOwnProperty('$dirty')) {
          scope.$broadcast(k + '::sanji-submit');
        }
      }

      var deferred = $q.defer();

      $timeout(function () {
        if (form.$valid) {
          deferred.resolve('success');
        } else {
          deferred.reject('error');
        }
      });

      return deferred.promise;
    };

    self.useBlur = function(ctrl) {
      if (ctrl && angular.isDefined(ctrl.validatorMethod)) {
        return ('blur' === ctrl.validatorMethod);
      }
      return ('blur' === self.getValidMethod());
    };

    self.useSubmit = function(ctrl) {
      if (ctrl && angular.isDefined(ctrl.validatorMethod)) {
        return ('submit' === ctrl.validatorMethod);
      }
      return ('submit' === self.getValidMethod());
    };

    self.$get = ['$injector', function ($injector) {

      setup($injector);

      return {
        getCustomErrorHtml: self.getCustomErrorHtml,
        getErrorHtml: self.getErrorHtml,
        getValidMethod: self.getValidMethod,
        getValidators: self.getValidators,
        getValidatorsByNames: self.getValidatorsByNames,
        isRegExp: self.isRegExp,
        isReservedRule: self.isReservedRule,
        runReservedRule: self.runReservedRule,
        setCustomErrorHtml: self.setCustomErrorHtml,
        setValidMethod: self.setValidMethod,
        setValidators: self.setValidators,
        useBlur: self.useBlur,
        useSubmit: self.useSubmit,
        validate: self.validate
      };
    }];
  });
})();
