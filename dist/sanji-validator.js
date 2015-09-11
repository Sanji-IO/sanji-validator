/*globals window, angular*/
(function() {
  'use strict';

  // lodash is going to be used.
  angular.module('sanji.validator.value', [])
  .value('_', window._)
  .value('sanjiDefaultValidators', {

    email: {
      rule: /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i,
      error: "Invalid email format."
    },

    password: {
      rule: /^(?=.*\d)(?=.*[a-zA-Z]).{6,100}$/,
      error: "Invalid password format. Password must include at least on letter, one numeric digit and must be at least 6 characters, no more than 100 characters."
    },

    greater: {
      rule: function(value, greater) {
        value = +value;
        greater = +greater;
        return greater <= value ? true : false;
      },
      error: "The value should be greater or equal {{greater}}."
    },

    range: {
      rule: function(value, minlength, maxlength) {
        var length = value.length;
        minlength = +minlength;
        maxlength = +maxlength;
        return (minlength <= length) && (length <= maxlength);
      },
      error: "The value should be in range ({{minlength}} ~ {{maxlength}})."
    },

    community: {
      rule: /^\.{1,100}$/,
      error: "Invalid community format.",
      scope: {
        minlength: 1,
        maxlength: 100
      }
    },

    required: {
      error: "This field is required."
    },

    ip: {
      rule: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      error: "Invalid IP format."
    },

    dial: {
      rule: /^([0-9#\*]{1,})$/,
      error: "Invalid dial number format."
    },

    number: {
      rule: /^\s*\d+\s*$/,
      error: "Invalid number format."
    },

    port: {
      rule: /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
      error: "Invalid port format."
    },

    ipsecAuthKey: {
      rule: /[\d]{16}/,
      error: "The key length must equal to 16 characters."
    },

    ipsecEncryptKey: {
      rule: /[\d]{24}/,
      error: "The key length must equal to 24 characters."
    },

    mac: {
      rule: /^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/,
      error: "This isn't mac address."
    },

    percentage: {
      rule: /(^(100(?:\.0{1,2})?))|(?!^0*$)(?!^0*\.0*$)^\d{1,2}(\.\d{1,2})?$/,
      error: "The range of percentage is 1 - 100 and can't be empty."
    },

    weight: {
      rule: /^(10|[1-9]?)$/,
      error: "The range of weight is 1 - 10 and can't be empty."
    },

    floatNum: {
      rule: /[-+]?(\d*[.])?\d+/,
      error: "This isn't float number and can't be empty."
    },

    passwordLen: {
      rule: /^\w{5,}$/,
      error: "The password is at least 5 length."
    },

    // This is for update account password.
    trackerTimeInterval: {
      rule: function(value) {
        return ((0 < value) && (value <= 120));
      },
      error: "The range is 1 - 120 and can't be empty."
    },

    // This is for update account password.
    confirmPassword: {
      rule: function(value, scope) {
        return (value === scope.$parent.account.newPwd);
      },
      error: "Confirm error."
    },

    wifiWepKeyFormat: {
      rule: function(value) {

        var pattern = '^[0-9a-zA-Z]{5}$|' +
          '^[0-9a-zA-Z]{13}$|' +
          '^[0-9a-zA-Z]{16}$|' +
          '^[0-9a-zA-Z]{29}$|' +
          '^[0-9a-fA-F]{10}$|' +
          '^[0-9a-fA-F]{26}$|' +
          '^[0-9a-fA-F]{32}$|' +
          '^[0-9a-fA-F]{58}$';

        return new RegExp(pattern).test(value);
      },
      error: "The HEX key length must be 10, 26, 32 or 58 and ASCII key length must be 5, 13, 16 or 29."
    },

    wifiPskFormat: {
      rule: function(value) {
        return /^[0-9a-zA-Z]{8,62}$|^[0-9a-fA-F]{64}$/.test(value);
      },
      error: "The HEX key length must be 64 and ASCII key length must be 8 - 63."
    },

    wifiRadiusKeyFormat: {
      rule: function(value) {
        return /^[0-9a-zA-Z]{8,31}$/.test(value);
      },
      error: "The ASCII key length must be 8 - 31."
    }

  });
})();

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
      return -1 !== ['range', 'greater'].indexOf(name);
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

/*globals angular*/
(function() {
  'use strict';
  /**
   * Put this on your form tag if you want
   * to validate before ngSubmit
   *
   * @example <form name="form" ng-submit="submit()" sanji-validator-submit>
   */
  angular.module('sanji.validator.directive', ['sanji.validator.provider'])
  .directive('sanjiValidatorSubmit', ["sanjiValidatorConfig", function(sanjiValidatorConfig) {
    return {
      priority: -1,    // before ngSubmit
      restrict: 'A',
      require: ['form', '?sanjiValidatorMethod'],    // Also allow sanjiValidatorMethodCtrl to be required.
      controller: ['$scope', function($scope) {
        this.getScope = function() {
          return $scope;
        };
      }],
      link: function(scope, element, attrs, ctrls) {

        var formCtrl, sanjiValidatorMethodCtrl;

        formCtrl = ctrls[0];
        sanjiValidatorMethodCtrl = ctrls[1];

        element.on('submit', function(event) {

          // only validate for submit and blur method.
          if (sanjiValidatorConfig.useBlur(sanjiValidatorMethodCtrl) || sanjiValidatorConfig.useSubmit(sanjiValidatorMethodCtrl)) {

            event.stopImmediatePropagation();

            sanjiValidatorConfig.validate(scope, formCtrl)
              .then(function() {
                scope.$eval(attrs.ngSubmit);
              });
          }
        });
      }
    };
  }])
  .directive('sanjiCheckFormValid', ["sanjiValidatorConfig", function(sanjiValidatorConfig) {
    return {
      restrict: 'A',
      require: ['^form', '^sanjiValidatorSubmit'],
      link: function(scope, element, attrs, ctrls) {

        var formCtrl, parentCtrl;

        formCtrl = ctrls[0];
        parentCtrl = ctrls[1];

        element.on('click', function() {
          sanjiValidatorConfig.validate(parentCtrl.getScope(), formCtrl)
            .then(function() {
              scope.$eval(attrs.sanjiCheckFormValid);
            });
        });
      }
    };
  }])
  .directive('sanjiValidatorNoErrorMsg', function() {
    /**
     * Disable a form's error message.
     * @example <form name="form" ng-submit="submit()" sanji-validator-no-error-msg>
     */
    return {
      restrict: 'A',
      require: 'form',
      controller: function() {
      }
    };
  })
  .directive('sanjiValidatorMethod', function() {
    /**
     * Set a form's validator method.
     * @example <form name="form" ng-submit="submit()" sanji-validator-method>
     */
    return {
      restrict: 'A',
      require: 'form',
      scope: {
        sanjiValidatorMethod: '@'
      },
      controller: ["$scope", function($scope) {
        this.validatorMethod = $scope.sanjiValidatorMethod;
      }]
    };
  })
  .directive('sanjiValidator', ["sanjiValidatorConfig", "$interpolate", "$compile", "_", "$timeout", function(sanjiValidatorConfig, $interpolate, $compile, _, $timeout) {

    /**
     * The sanji validator directive.
     * @example <input type="text" name="username" ng-model="user.name" sanji-validator="username,required" />
     */

    var validate, setHtml, runCallback, newScope, oldScopes;

    oldScopes = {};

    /**
     * Internal validate function of sanjiValidator directive.
     *
     * @private
     * @param {string} value The value to be validated.
     * @param {Array} validators List of validators.
     * @param {Object} ngModelCtrl
     * @param {Array} attrs
     * @return {Object} Object with properties error and errorValidator
     *         error {boolean} Has error or not.
     *         errorValidator {object} Validator object.
     */
    validate = function(value, validators, ngModelCtrl, attrs) {

      var error, errorValidator;

      error = false;

      _.each(validators, function(validator) {

        var rule, hasValue;

        rule = validator.rule;
        hasValue = !! value;    // convert to boolean

        if ('required' === validator.name) {
          error = ! (hasValue);
        }
        else if (! (hasValue)) {
          // allow empty value for all validators except required
          error = false;
        }
        else if (sanjiValidatorConfig.isReservedRule(validator.name)) {
          error = ! sanjiValidatorConfig.runReservedRule(rule, value, attrs);
        }
        else if (angular.isFunction(rule)) {
          error = ! rule(value);
        }
        else if (sanjiValidatorConfig.isRegExp(rule)) {
          error = ! rule.test(value);
        }

        if (error) {
          errorValidator = validator;
          return false;
        }
      });

      ngModelCtrl.$setValidity(ngModelCtrl.$name, ! error);

      return {
        error: error,
        errorValidator: errorValidator
      };
    };

    /**
     * Set message to field.
     *
     * @private
     * @param {Object} element Element from directive link function.
     * @param {Object} ret The returned object of validate function.
     * @param {Array} attrs Attrs from directive link function.
     * @param {Object} options Object that has properties beforeElementSelector or scope.
     */
    setHtml = function(element, ret, attrs, options) {

      if (angular.isString(options.beforeElementSelector)) {
        element = element.closest(options.beforeElementSelector);
      }

      if (ret.error) {

        var errorMessage = ret.errorValidator.error;

        if (sanjiValidatorConfig.isReservedRule(ret.errorValidator.name)) {
          var exp = $interpolate(ret.errorValidator.error);
          errorMessage = exp(attrs);
        }

        var customErrorHtml = sanjiValidatorConfig.getCustomErrorHtml();

        if (customErrorHtml) {

          var key = options.scope.$id + element.attr('name');

          if (oldScopes[key]) {
            oldScopes[key].$destroy();
          }

          newScope = options.scope.$new();
          oldScopes[key] = newScope;
          newScope.errorMessage = errorMessage;

          // Handle something like angular translate <p class="error">errorMessage | translate</p>
          // This make the template active with scope.
          $timeout(function() {

            element.next()
              .html($compile(customErrorHtml)(newScope));
          });

        } else {
          return element.next()
            .html(sanjiValidatorConfig.getErrorHtml(errorMessage));
        }
      }
      return element.next().html('');
    };

    /**
     * Run valid callback or invalid callback.
     *
     * @private
     * @param {boolean} error Has error or not.
     * @param {Object} errorValidator Validator that has error.
     * @param {Object} scope Directive scope.
     */
    runCallback = function(error, errorValidator, scope) {
      if (error) {
        scope.invalidCallback({errorValidator: errorValidator});
      } else {
        scope.validCallback();
      }
    };

    return {
      restrict: 'A',
      require: ['ngModel', '?^sanjiValidatorMethod', '?^sanjiValidatorNoErrorMsg', '^form'],
      scope: {
        ngModel: '=',
        validCallback: '&',
        invalidCallback: '&',
        beforeElementSelector: '@'
      },
      link: function(scope, element, attrs, ctrls) {

        // if beforeElementSelector is set, put span tag close to it.
        if (angular.isString(scope.beforeElementSelector)) {
          element.closest(scope.beforeElementSelector).after('<span></span>');
        } else {
          element.after('<span></span>');
        }

        var validatorNames, validators, setBlurBehavior,
            ngModelCtrl, sanjiValidatorMethodCtrl, options,
            sanjiValidatorNoErrorMsgCtrl, formCtrl;

        ngModelCtrl = ctrls[0];
        sanjiValidatorMethodCtrl = ctrls[1];
        sanjiValidatorNoErrorMsgCtrl = ctrls[2];
        formCtrl = ctrls[3];

        validatorNames = attrs.sanjiValidator.split(',');
        validators = sanjiValidatorConfig.getValidatorsByNames(validatorNames);
        ngModelCtrl.$setValidity(ngModelCtrl.$name, true);
        options = {};
        options.beforeElementSelector = scope.beforeElementSelector;
        options.scope = scope;

        // dynamically change the validator list.
        scope.$on('sanji::validators::change', function() {
          validators = sanjiValidatorConfig.getValidatorsByNames(validatorNames);
        });

        // handle submit for provider's validate function
        scope.$on(ngModelCtrl.$name + '::sanji-submit', function() {
          var ret = validate(element[0].value, validators, ngModelCtrl, attrs);

          if (! angular.isDefined(sanjiValidatorNoErrorMsgCtrl) || null === sanjiValidatorNoErrorMsgCtrl) {
            setHtml(element, ret, attrs, options);
          }
          runCallback(ret.error, ret.errorValidator, scope);

          if (ret.error && (false === formCtrl.hasSetFocus)) {
            element[0].focus();
            formCtrl.hasSetFocus = true;
          }
        });

        if (sanjiValidatorConfig.useSubmit(sanjiValidatorMethodCtrl)) {
          return;
        }

        setBlurBehavior = function() {
          element.bind('blur', function() {
            scope.$apply(function() {
              var ret = validate(element[0].value, validators, ngModelCtrl, attrs);

              if (! angular.isDefined(sanjiValidatorNoErrorMsgCtrl) || null === sanjiValidatorNoErrorMsgCtrl) {
                setHtml(element, ret, attrs, options);
              }
              runCallback(ret.error, ret.errorValidator, scope);
            });
          });
        };

        if (sanjiValidatorConfig.useBlur(sanjiValidatorMethodCtrl)) {
          setBlurBehavior();
          return;
        }

        scope.$watch('ngModel', function(value) {

          if (ngModelCtrl.$pristine && ngModelCtrl.$viewValue) {
            // has value when initial
            ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue);
          }

          var ret = validate(value, validators, ngModelCtrl, attrs);

          if (! angular.isDefined(sanjiValidatorNoErrorMsgCtrl) || null === sanjiValidatorNoErrorMsgCtrl) {
            setHtml(element, ret, attrs, options);
          }
          runCallback(ret.error, ret.errorValidator, scope);
        });
      }
    };
  }]);

})();

/*globals angular*/

(function() {
  'use strict';

  // include the modules all together
  angular.module('sanji.validator', [
    'sanji.validator.value',
    'sanji.validator.provider',
    'sanji.validator.directive'
  ]);
})();
