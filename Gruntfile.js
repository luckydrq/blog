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
    },
    watch: {
      buildsite: {
        files: ['**/*'],
        tasks: ['cssmin:combine','shell:jekyll'],
        options: {
          spawn: false
        }
      }
    },
    shell: {
      jekyll: {
        command: "jekyll build"
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');

  // Default task(s).
  grunt.registerTask('default', ['cssmin:combine']);
}