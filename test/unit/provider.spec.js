'use strict';

describe('sanjiValidatorConfig', function(){

  var scope, provider;

  beforeEach(angular.mock.module('sanji.validator'));

  beforeEach(inject(function($rootScope) {
    scope = $rootScope.$new();
  }));

  it(' should have ability to set validate method', inject(function(sanjiValidatorConfig) {

    sanjiValidatorConfig.setValidMethod('blur');

    var result = sanjiValidatorConfig.getValidMethod();
    expect(result).toEqual('blur');
  }));

  it(' should be able to set the validators', inject(function(sanjiValidatorConfig) {

    // test if it can set the custom error message
    sanjiValidatorConfig.setValidators({
      required: {
        error: "This field is required. Don't leave it empty."
      }
    });

    var result = sanjiValidatorConfig.getValidators();
    expect(result).toEqual({required: {
        error: "This field is required. Don't leave it empty."
    }});
  }));

});
