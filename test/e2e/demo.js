'use strict';

describe('The demo page', function () {

  beforeEach(function () {
    browser.get('http://localhost:3000');
  });

  it('shows at least 4 forms', function () {
    element.all(by.css('form')).count().then(function(count) {
      expect(count >= 4).toBeTruthy();
    });
  });

});
