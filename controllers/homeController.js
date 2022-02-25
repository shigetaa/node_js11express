exports.top = (req, res) => {
	res.render('index', { title: 'Welcome', message: 'Hello World!' })
};