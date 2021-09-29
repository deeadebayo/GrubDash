const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

const createDish = (req, res) => {
	const {date :{name, description, price, image_url} = {}} = req.body
	const newId = new nextId;
	const newDish = {
		id: newId,
		name: res.locals.name,
		description: res.locals.description,
		price: res.locals.price,
		image_url: image_url
	}
	dishes.push(newDish)
	res.status(201).json({data: newDish})
}

const ifDataIdMatches = (req, res, next) => {
	const {data:{id} = {}} = req.body
	const dishId = req.params.dishId

	if(id!==undefined && id !==null && id !== "" && id !== dishId) {
		next({
			status: 400,
			message: `${id} not matching dataId provided`
		})
	}
	return next()
}

const dishExists = (req, res, next) => {
	const dishId = req.params.dishId
	const foundDish = dishes.find(dish => dish.id ===dishId)
	if(foundDish) {
		res.local.dish = foundDish;
		next()
	} else {
		next({status: 404, message: `Dish ${dishId} not found.`})
	}
}

const read = (req,res,next) => {
	res.json({data: res.locals.dish})
}

const nameExists = (req, res, next) => {
	const {data: {name} = {}} = req.body
	if(name) {
		res.locals.name = name;
		return next()
	}
	next({
		status: 400,
		message:'Dish must include a name'
	})
}
