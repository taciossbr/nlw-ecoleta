import { Request, Response } from 'express'
import knex from '../database/connection'

export default class ItemsController {
  async index(request: Request, response: Response) {
    const items = await knex('items').select('*')
    console.log(items)

    const serializedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      image_url: `http://192.168.0.112:3333/uploads/${item.image}`
    }))

    return response.json(serializedItems)
  }
}
