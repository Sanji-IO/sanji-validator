'use strict';

describe('sanjiValidatorConfig', function(){

  var validatorConfig, validatorConfigProvider;

  beforeEach(function() {

    var fakeModule = angular.module('test.app', function() {});
    fakeModule.config(function(sanjiValidatorConfigProvider) {
      validatorConfigProvider = sanjiValidatorConfigProvider;
    });

    // initialize test.app injector
    module('sanji.validator', 'test.app');
  });

  // inject sanjiValidatorConfig for every "it" function
  beforeEach(inject(function(sanjiValidatorConfig) {
    validatorConfig = sanjiValidatorConfig;
  }));

  it('should have ability to set validate method', function() {

    validatorConfig.setValidMethod('blur');

    var result = validatorConfig.getValidMethod();
    expect(result).toEqual('blur');
  });

  it('should be able to set the validators', function() {

    // test if it can set the custom error message
    validatorConfig.setValidators({
      required: {
        error: "This field is required. Don't leave it empty."
      }
    });

    var result = validatorConfig.getValidators();
    expect(result).toEqual({required: {
        error: "This field is required. Don't leave it empty."
    }});
  });

  it('should have range as the only reserved rule now', function() {
    var isReservedRule = validatorConfig.isReservedRule('range');
    expect(isReservedRule).toBe(true);
  });

  it('should extract my variables from function string', function() {

    var myFunc, args;

    myFunc = function(one, two, three) {};
    args = validatorConfigProvider.extractVarFromFunc(myFunc.toString());
    expect(args).toEqual(['one', 'two', 'three']);
  });

  it('should know if a variable is RegExp', function() {
    var result = validatorConfig.isRegExp(/^test$/);
    expect(result).toBe(true);
  });

  it('should use blur', function() {
    validatorConfig.setValidMethod('blur');
    var result = validatorConfig.useBlur();
    expect(result).toBe(true);
  });

  it('should use submit', function() {
    validatorConfig.setValidMethod('submit');
    var result = validatorConfig.useSubmit();
    expect(result).toBe(true);
  });

  it('should have default error html', function() {
    var result = validatorConfig.getErrorHtml('something went wrong');
    expect(result).toEqual('<p class="validation-invalid">something went wrong</p>');
  });

  it('should be able to set custom error html', function() {
    var myHtml, result;
    myHtml = '<div>{{errorMessage}}</div>';
    validatorConfig.setCustomErrorHtml(myHtml);
    result = validatorConfig.getCustomErrorHtml();
    expect(result).toBe(myHtml);
  });

  it('should run reserved rule successfully', function() {
    var isHeavy, result;

    isHeavy = function(value) {
      return value > 80;
    };
    result = validatorConfig.runReservedRule(isHeavy, 180, {});
    expect(result).toBe(true);
  });
});
