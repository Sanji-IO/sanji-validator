/*globals window, angular*/
(function() {
  'use strict';

  angular.module('sanji.validator.value', [])
  .value('_', window._);
})();

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

      var index = 0;

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

(function() {
  'use strict';

  angular.module('sanji.validator.directive', ['sanji.validator.provider'])
  .directive('sanjiValidatorSubmit', ["sanjiValidatorConfig", function(sanjiValidatorConfig) {
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
  }])
  .directive('sanjiValidatorNoErrorMsg', function() {
    return {
      restrict: 'A',
      require: 'form',
      controller: ["$scope", function($scope) {
      }]
    };
  })
  .directive('sanjiValidatorMethod', function() {
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
  }]);

})();

/*globals angular*/

(function() {
  'use strict';

  angular.module('sanji.validator', [
    'sanji.validator.value',
    'sanji.validator.provider',
    'sanji.validator.directive'
  ]);
})();
