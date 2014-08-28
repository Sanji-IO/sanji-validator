'use strict';

describe('The demo page', function () {

  var ptor = protractor.getInstance();

  beforeEach(function () {
    browser.get('http://localhost:3000');
  });

  it('should show at least 4 forms', function () {
    element.all(by.css('form'))
      .count()
      .then(function(count) {
        expect(count >= 4).toBeTruthy();
      });
  });

  // DIRTY: wait for protractor to fix this for firefix
  var sendKeys = function(element, letters) {
    var arr = letters.split('');
    arr.forEach(function(letter) {
      element.sendKeys(letter);
    });
  };

  it(' can be submitted when email and range fields are filled ( Watch Method )', function () {

    var emailInput, rangeInput, submitBtn;

    emailInput = element.all(by.model('user.email')).get(0);
    rangeInput = element.all(by.model('user.range')).get(0);
    submitBtn = element.all(by.css('[type="submit"]')).get(0);

    sendKeys(emailInput, 'kmsh3ng@gmail.com');
    sendKeys(rangeInput, '1234567');

    expect(submitBtn.isEnabled()).toBe(true);
  });

  it(' cannot be submitted when fields are empty ( Blur Method )', function () {

    var submitBtn = element.all(by.css('[type="submit"]')).get(1);
    submitBtn.click();

    var errorMsg = element(by.cssContainingText('.validation-invalid', 'is required'));
    expect(errorMsg.isPresent()).toBe(true);
  });
});
