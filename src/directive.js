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
  .directive('sanjiValidatorSubmit', function(sanjiValidatorConfig) {
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
  })
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
      controller: function($scope) {
        this.validatorMethod = $scope.sanjiValidatorMethod;
      }
    };
  })
  .directive('sanjiValidator', function(sanjiValidatorConfig, $interpolate, $compile, _, $timeout) {

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
  });

})();
