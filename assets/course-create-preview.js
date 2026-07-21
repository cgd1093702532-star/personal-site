/** 发布课程 · 预览页 */
(function () {
  const root = document.getElementById('course-create-root');
  if (!root || !window.CourseFormPreview) return;
  window.CourseFormPreview.renderForm(root, {
    mock: window.CourseFormPreview.defaultMock,
    publishHref: 'my-courses.html',
  });
})();
