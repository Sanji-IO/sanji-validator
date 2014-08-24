'use strict';

describe('provider', function(){

  var scope, provider;

  beforeEach(angular.mock.module('sanji.validator'));

  beforeEach(inject(function($rootScope) {
    scope = $rootScope.$new();
  }));

  it('provider should have ability to set validate method', inject(function($controller) {

    inject(['sanjiValidatorConfig', function(sanjiValidatorConfig) {

      sanjiValidatorConfig.setValidMethod('blur');

      var result = sanjiValidatorConfig.getValidMethod();
      expect(result).toEqual('blur');
    }]);

  }));
});
