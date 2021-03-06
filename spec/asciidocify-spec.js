describe('asciidocify', function () {
  describe('fetchContent', function () {
    beforeEach(function () {
      asciidoctor.browser.convert = function () {};
    });

    it('should call convert method if extension is enabled', function () {
      // Given
      var data = {};
      data.responseText = '= Hello world';
      spyOn(browser.storage.local, 'get').and.callFake(function (name, callback) {
        var values = [];
        values[asciidoctor.browser.ENABLE_RENDER_KEY] = true;
        callback(values);
      });
      spyOn(asciidoctor.browser, 'convert');
      // When
      asciidoctor.browser.loadContent(data);
      // Then
      expect(asciidoctor.browser.convert).toHaveBeenCalledWith('= Hello world');
    });

    it('should not call convert method if extension is disabled', function () {
      // Given
      var data = {};
      data.responseText = '= Hello world';
      spyOn(browser.storage.local, 'get').and.callFake(function (name, callback) {
        var values = [];
        values[asciidoctor.browser.ENABLE_RENDER_KEY] = false;
        callback(values);
      });
      spyOn(asciidoctor.browser, 'convert');
      // When
      asciidoctor.browser.loadContent(data);
      // Then
      expect(asciidoctor.browser.convert).not.toHaveBeenCalledWith('= Hello world');
    });
  });
});
