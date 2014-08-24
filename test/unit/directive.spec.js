'use strict';

describe('sanjiValidator', function() {

  var element, scope;

  beforeEach(module('sanji.validator'));

  beforeEach(inject(function($rootScope, $compile, sanjiValidatorConfig) {

    sanjiValidatorConfig.setValidators({

      range: {
        rule: function(value, minlength, maxlength) {    // this field shoud have minlength and maxlength HTML attribute
          var length = value.length;
          return (minlength <= length) && (length <= maxlength);
        },
        error: "The value should be in range ({{minlength}} ~ {{maxlength}})"
      },

      required: {
        error: "This field is required."
      },

      ip: {
        // rule can be defined as RegExp or function
        rule: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        error: "This ip format is invalid."
      }
    });

    scope = $rootScope.$new();
    scope.name = '';
    element = angular.element('<form name="form" ng-submit="submit()"><input id="test" type="text" sanji-validator="required" name="name" ng-model="name"></form>');
    element = $compile(element)(scope);
    scope.$digest();
  }));

  it(' should have isolated scope', inject(function($rootScope, $compile, sanjiValidatorConfig) {

    var input = element.find('input');
    expect(input.isolateScope()).toBeDefined();
  }));

})
