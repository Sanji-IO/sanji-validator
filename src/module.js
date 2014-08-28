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
