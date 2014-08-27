/*globals angular*/
(function() {
  'use strict';

  angular.module('sanji.validator.directive', ['sanji.validator.provider'])
  .directive('sanjiValidatorSubmit', function(sanjiValidatorConfig) {
    return {
      priority: -1,    // before ngSubmit
      restrict: 'A',
      require: ['form', '?sanjiValidatorMethod'],
      link: function(scope, element, attrs, ctrls) {

        var formCtrl, sanjiValidatorMethodCtrl;

        formCtrl = ctrls[0];
        sanjiValidatorMethodCtrl = ctrls[1];

        element.on('submit', function(event) {

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
  .directive('sanjiValidatorNoErrorMsg', function() {
    return {
      restrict: 'A',
      require: 'form',
      controller: function($scope) {
      }
    };
  })
  .directive('sanjiValidatorMethod', function() {
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

    var validate, setHtml, runCallback, newScope, oldScopes;

    oldScopes = {};

    validate = function(value, validators, ngModelCtrl, attrs) {

      var error, errorValidator;

      error = false;

      _.each(validators, function(validator) {

        var rule, hasValue;

        rule = validator.rule;
        hasValue = !! value;

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

        scope.$on('sanji::validators::change', function() {
          validators = sanjiValidatorConfig.getValidatorsByNames(validatorNames);
        });

        scope.$on(ngModelCtrl.$name + '::sanji-submit', function() {
          var ret = validate(element[0].value, validators, ngModelCtrl, attrs);

          if (! angular.isDefined(sanjiValidatorNoErrorMsgCtrl)) {
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

              if (! angular.isDefined(sanjiValidatorNoErrorMsgCtrl)) {
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

          if (! angular.isDefined(sanjiValidatorNoErrorMsgCtrl)) {
            setHtml(element, ret, attrs, options);
          }
          runCallback(ret.error, ret.errorValidator, scope);
        });
      }
    };
  });

})();
