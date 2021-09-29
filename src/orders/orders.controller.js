const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

const orderExists = (req, res, next) =>{
  const  orderId  = req.params.orderId;
  const foundOrder = orders.filter((order) => order.id === orderId);
  if (foundOrder.length > 0) {
    res.locals.order = foundOrder;
    next();
  } else {
    next({ status: 404, message: `Order ${orderId} not found.` });
  }
}

const isIdValid = (req, res, next) =>{
  let { data: { id } } = req.body;
  const orderId = req.params.orderId;
  if (
    req.body.data.id === null ||
    req.body.data.id === undefined ||
    req.body.data.id === ""
  ) {
    return next();
  }
  if (req.body.data.id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  } else {
    next();
  }
}

const isDeliverToValid = (req, res, next) =>{
  const { data: deliverTo } = req.body;
  if (
    req.body.data.deliverTo === null ||
    req.body.data.deliverTo === "" ||
    req.body.data.deliverTo === undefined
  ) {
    next({ status: 400, message: "Order must include a deliverTo." });
  }
  next();
}

const isStatusValid = (req, res, next) =>{
  const { data: { status } = {} } = req.body;

  try {
    if (
      status !== ("pending" || "preparing" || "out-for-delivery" || "delivered")
    ) {
      next({
        status: 400,
        message:
          " Order must have a status of pending, preparing, out-for-delivery, delivered.",
      });
    }
    if (status === "delivered") {
      return next({
        status: 400,
        message: " A delivered order cannot be changed.",
      });
    }
    next();
  } catch (error) {
    console.log("ERROR =", error);
  }
}

const validateCreate = (req, res, next) =>{
  const { deliverTo, mobileNumber, dishes } = req.body.data;
  if (!deliverTo) {
    next({ status: 400, message: "Order must include a deliverTo." });
  }
  if (!mobileNumber) {
    next({ status: 400, message: "Order must include a mobileNumber." });
  }
  if (!dishes) {
    next({ status: 400, message: "Order must include a dish." });
  }
  if (!Array.isArray(dishes) || !dishes.length > 0) {
    return next({
      status: 400,
      message: `Dishes must include at least one dish.`,
    });
  }
  dishes.map((dish, index) => {
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      !dish.quantity > 0
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
      });
    }
  });

  res.locals.order = req.body.data;
    next();
}

const create = (req, res) =>{
const newOrder = { ...res.locals.order, id: nextId() };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}


const read = (req, res, next) =>{
  const foundOrder = res.locals.order;
  if (foundOrder) {
    res.json({ data: foundOrder[0] });
  }
}


const update = (req, res) =>{
  const orderId = req.params.orderId;
  let { data: id, deliverTo, mobileNumber, status, dishes } = req.body;
  let updatedOrder = {
    id: orderId,
    deliverTo: req.body.data.deliverTo,
    mobileNumber: req.body.data.mobileNumber,
    status: req.body.data.status,
    dishes: req.body.data.dishes,
  };

  return res.json({ data: updatedOrder });
}

const destroy = (req, res, next) =>{
  const orderId = req.params.orderId;
  const foundOrder = res.locals.order;

  const index = orders.find((order) => order.id === Number(orderId));
  const toDelete = orders.splice(index, 1);
  if (foundOrder[0].status === "pending") {
    res.sendStatus(204);
  }

  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending.",
  });
}

const list = (req, res) =>{
  res.json({ data: orders });
}


module.exports = {
  create: [validateCreate, create],
  read: [orderExists, read],
  update: [orderExists, validateCreate, isIdValid, isStatusValid, update],
  destroy: [orderExists, destroy],
  list,
};
