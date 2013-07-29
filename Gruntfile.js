module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      options: {
        keepSpecialComments: false
      },
      combine: {
        files: {
          './assets/css/lucky.css': ['./assets/css/blog.css', './assets/css/font.css', './assets/css/syntax.css']
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('default', ['cssmin']);
}