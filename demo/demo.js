angular.module('demoApp', ['sanji.validator']);

angular.module('demoApp')
.run(function(sanjiValidatorConfig) {

  sanjiValidatorConfig.setValidators({
    required:{
      error: 'This field is required.'
    },
    range: {
      rule: function(value, minlength, maxlength) {
         var length = value.length;
         return (minlength <= length) && (length <= maxlength);
      },
      error: 'Input length should be {{minlength}} ~ {{maxlength}}'
    },
    email: {
      rule: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      error: 'Invalid Email format.'
    }
  });
});

angular.module('demoApp')
.controller('WatchFormCtrl', function($scope) {
  $scope.submit = function() {
    alert(JSON.stringify($scope.user));
  };
});

angular.module('demoApp')
.controller('BlurFormCtrl', function($scope) {
  $scope.submit = function() {
    alert(JSON.stringify($scope.user));
  };
});

angular.module('demoApp')
.controller('SubmitFormCtrl', function($scope) {
  $scope.submit = function() {
    alert(JSON.stringify($scope.user));
  };
});

angular.module('demoApp')
.controller('InvalidCbFormCtrl', function($scope) {
  $scope.bad = function(errorValidator) {
    alert(JSON.stringify(errorValidator));
  };
  $scope.good = function() {
    alert('good');
  };
  $scope.submit = function() {
    alert(JSON.stringify($scope.user));
  };
});
