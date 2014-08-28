/*globals angular*/
(function() {
  'use strict';

  /**
   * Provider to store validator config and
   * provide validator related functions.
   */
  angular.module('sanji.validator.provider', ['sanji.validator.value'])
  .provider('sanjiValidatorConfig', function() {

    var self, config, setup, $injector,
        $rootScope, $q, $timeout, _;

    self = this;
    config = {};
    config.validators = {};
    config.validMethod = 'watch';

    /**
     * Setup the injections.
     *
     * @param {Object} injector angular $injector.
     */
    setup = function (injector) {
      $injector = injector;
      $q = $injector.get('$q');
      $timeout = $injector.get('$timeout');
      $rootScope = $injector.get('$rootScope');
      _ = $injector.get('_');
      config.validators = $injector.get('sanjiDefaultValidators');
    };

    /**
     * Check if the validator is reserved.
     *
     * @param {boolean} is reserved or not.
     */
    self.isReservedRule = function(name) {
      return -1 !== ['range'].indexOf(name);
    };

    /**
     * Extrac function arguments from function string.
     *
     * @example
     * sanjiValidatorConfig.extractVarFromFunc(function(first, second, third) {});
     * @param {Array} An array consisting of function arguments.
     */
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

    /**
     * Execute the reserved rule.
     *
     * @param {(RegExp|function)} rule Validation function.
     * @param {string} value The value to be checked.
     * @param {Array} attrs An array of attributes from directive link function.
     */
    self.runReservedRule = function(rule, value, attrs) {

      var args, scope, values;

      scope = {};
      values = [];
      args = self.extractVarFromFunc(rule);

      scope.value = value;

      // lodash each doesn't guarantee order of properties
      _.each(attrs, function(value, property) {
        // skip value
        if ('value' === property) {
          return true;
        }
        if (-1 !== args.indexOf(property)) {
          scope[property] = value;
        }
      });

      // put values in correct order
      _.each(args, function(arg) {
        values.push(scope[arg]);
      });

      return rule.apply(this, values);
    };

    /**
     * Set validation method.
     *
     * @param {string} method The method to be set. Can be submit, blur or watch.
     */
    self.setValidMethod = function(method) {
      config.validMethod = method;
    };

    /**
     * Get validation method.
     *
     * @return {string} Method name.
     */
    self.getValidMethod = function() {
      return config.validMethod;
    };

    /**
     * Set Validators.
     *
     * @param {object} rows The validation rules.
     */
    self.setValidators = function(rows) {
      angular.extend(config.validators, rows);
      $rootScope.$broadcast('sanji::validators::change');
    };

    /**
     * Get Validators.
     *
     * @return {Object} Validators.
     */
    self.getValidators = function() {
      return config.validators;
    };

    /**
     * Get multiple validators by validators' names.
     *
     * @param {Array} names Validators' names.
     * @return {Array} An Array of Validators.
     */
    self.getValidatorsByNames = function(names) {

      var allValidators, validators;

      allValidators = self.getValidators();
      validators = [];

      _.each(names, function(name) {

        var validator;

        // handle spaces. e.g. ['ip', 'required']
        name = name.replace(/^\s+|\s+$/g, '');
        validator = allValidators[name];

        // throw error to developer if given validator name is not set.
        if (! validator) {
          throw new Error('validator ' + name + ' not found.');
        }
        validator.name = name;
        validators.push(validator);
      });

      return validators;
    };

    /**
     * Set customized error HTML.
     * Angular expression is also available.
     *
     * @example
     * sanjiValidatorConfig.setCustomErrorHtml('<p class="validation-invalid">{{errorMessage | translate}}</p>');
     *
     * @param {string} HTML HTML template.
     */
    self.setCustomErrorHtml = function(HTML) {
      config.customCustomErrorHtml = HTML;
    };

    /**
     * Get customized error HTML.
     *
     * @return {(string|undefined)} Saved HTML template.
     */
    self.getCustomErrorHtml = function() {
      return config.customCustomErrorHtml;
    };

    /**
     * Get default error HTML,
     *
     * @param {string} message The message to be embeded.
     * @return {string} Default error HTML.
     */
    self.getErrorHtml = function(message) {
      return '<p class="validation-invalid">' + message + '</p>';
    };

    /**
     * Verify if the given object is RegExp.
     *
     * @param {Object} obj The RegExp object to be verified.
     * @return {boolean} Is RegExp or not.
     */
    self.isRegExp = function(obj) {
      return (RegExp === obj.constructor);
    };

    /**
     * Send events to validate the fields of given form controller.
     *
     * @param {Object} form The angular form controller.
     * @return {promise} promise object of angular $q implementation.
     */
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

    /**
     * Whether the global validator method setting is blur.
     * If ctrl param is provided then it will check the ctrl's setting instead.
     *
     * @param {(Object|undefined)} ctrl The controller object.
     * @return {boolean} Use blur method or not.
     */
    self.useBlur = function(ctrl) {
      if (ctrl && angular.isDefined(ctrl.validatorMethod)) {
        return ('blur' === ctrl.validatorMethod);
      }
      return ('blur' === self.getValidMethod());
    };

    /**
     * Whether the global validator method setting is submit.
     * If ctrl param is provided then it will check the ctrl's setting instead.
     *
     * @param {(Object|undefined)} ctrl The controller object.
     * @return {boolean} Use submit method or not.
     */
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
