// Per-MPASI-month food category lists, derived from monthly docx food tables.
// Month = Math.ceil(mpasiWeekNum / 4)
// Categories: Vegetable, Protein, Fruits, Others — same structure each month, foods differ.

export const FOOD_CATEGORIES_BY_MONTH = {
  1: [
    {
      category: 'Vegetable',
      foods: ['Bayam', 'Pak choy', 'Brokoli', 'Labu kuning', 'Sawi', 'Lobak merah', 'Tomato', 'Ubi kentang', 'Ubi keledek', 'Saderi'],
    },
    {
      category: 'Protein',
      foods: ['Daging', 'Ikan bilis', 'Tauhu'],
    },
    {
      category: 'Fruits',
      foods: ['Pisang', 'Betik', 'Honey dew', 'Buah naga', 'Epal', 'Tembikai'],
    },
    {
      category: 'Others',
      foods: ['Oat/bijirin', 'Roti', 'Kismis', 'Olive oil', 'Susu'],
    },
  ],
  2: [
    {
      category: 'Vegetable',
      foods: ['Bok choy', 'Taugeh', 'Capsicum', 'Beetroot', 'Sawi', 'Kubis', 'Mix vege', 'Carrot', 'Brokoli', 'Mushroom', 'Tomato', 'Zucchini', 'Jagung', 'Kubis bunga', 'Potato', 'Sweet potato', 'Labu kuning', 'Celery'],
    },
    {
      category: 'Protein',
      foods: ['Ayam', 'Ikan bilis', 'Ikan', 'Tauhu', 'Udang'],
    },
    {
      category: 'Fruits',
      foods: ['Papaya', 'Epal', 'Buah naga', 'Honeydew', 'Avocado', 'Tembikai', 'Pear', 'Mango'],
    },
    {
      category: 'Others',
      foods: ['Oatmeal', 'Cheese', 'Kismis', 'Olive oil', 'Wholemeal bread'],
    },
  ],
  3: [
    {
      category: 'Vegetable',
      foods: ['Kailan', 'Kacang buncis', 'Kubis purple', 'Raddish', 'Capsicum', 'Jagung', 'Mushroom', 'Brokoli', 'Tomato', 'Carrot', 'Sweet potato', 'Labu kuning', 'Taugeh', 'Celery', 'Kubis bunga', 'Zucchini', 'Bayam'],
    },
    {
      category: 'Protein',
      foods: ['Ayam', 'Daging', 'Ikan bilis', 'Ikan', 'Ikan salmon', 'Tauhu', 'Udang', 'Sotong', 'Telur', 'Liver'],
    },
    {
      category: 'Fruits',
      foods: ['Pisang', 'Papaya', 'Epal', 'Buah naga', 'Honeydew', 'Avocado', 'Tembikai', 'Pear', 'Mango', 'Kiwi'],
    },
    {
      category: 'Others',
      foods: ['Oatmeal', 'Cheese', 'Kismis', 'Unsalted butter', 'Olive oil'],
    },
  ],
  4: [
    {
      category: 'Vegetable',
      foods: ['Kailan', 'Capsicum', 'Kacang buncis', 'Jagung', 'Mushroom', 'Brokoli', 'Tomato', 'Carrot', 'Sweet potato', 'Labu kuning', 'Taugeh', 'Celery', 'Bayam', 'Kubis purple', 'Kubis bunga'],
    },
    {
      category: 'Protein',
      foods: ['Ayam', 'Daging', 'Ikan bilis', 'Ikan', 'Ikan salmon', 'Tauhu', 'Udang', 'Sotong', 'Telur', 'Liver'],
    },
    {
      category: 'Fruits',
      foods: ['Pisang', 'Papaya', 'Epal', 'Buah naga', 'Honeydew', 'Avocado', 'Tembikai', 'Pear', 'Mango', 'Kiwi', 'Frozen berries'],
    },
    {
      category: 'Others',
      foods: ['Oat', 'Cheese', 'Kismis', 'Unsalted butter', 'Olive oil', 'Red dates'],
    },
  ],
  5: [
    {
      category: 'Vegetable',
      foods: ['Mix vege', 'Broccoli', 'Celery', 'Cauliflower', 'Carrot', 'Corn', 'Tomato', 'Pumpkin', 'Sweet potato', 'Kacang buncis', 'Yellow bell pepper', 'Red bell pepper'],
    },
    {
      category: 'Protein',
      foods: ['Chicken breast', 'Beef', 'Pork', 'Fish', 'Ikan bilis', 'Prawn', 'Tofu', 'Egg tofu', 'Eggs', 'Liver'],
    },
    {
      category: 'Fruits',
      foods: ['Banana', 'Papaya', 'Honeydew', 'Dragon fruit', 'Watermelon', 'Mango', 'Kismis'],
    },
    {
      category: 'Others',
      foods: ['Oatmeal', 'Oat', 'Rice waffle', 'Banana pancake', 'Sweet potato cookies'],
    },
  ],
  6: [
    {
      category: 'Vegetable',
      foods: ['Spinach', 'Sayur manis', 'Sayur hongkong', 'Lobak putih', 'Lobak merah', 'Corn', 'Tomato', 'Pumpkin', 'Sweet potato', 'Kacang buncis', 'Celery', 'Mix vege', 'Broccoli', 'Cauliflower', 'Carrot'],
    },
    {
      category: 'Protein',
      foods: ['Chicken breast', 'Beef', 'Pork', 'Fish', 'Ikan bilis', 'Prawn', 'Tofu', 'Egg tofu', 'Eggs', 'Liver'],
    },
    {
      category: 'Fruits',
      foods: ['Banana', 'Papaya', 'Honeydew', 'Dragon fruit', 'Watermelon', 'Mango', 'Apple', 'Kismis'],
    },
    {
      category: 'Others',
      foods: ['Oat', 'Banana pancake', 'Banana + apple muffin', 'Dragon fruit pudding', 'Pumpkin pudding', 'Egg roll/omelette'],
    },
  ],
  7: [
    {
      category: 'Vegetable',
      foods: ['Kangkung', 'Bayam', 'Cucumber', 'Purple cabbage', 'Carrot', 'Broccoli', 'Corn', 'Pumpkin', 'Sweet potato', 'Celery', 'Mix vege', 'Zucchini', 'Yellow capsicum', 'Red capsicum', 'Sweet pea', 'Mushroom'],
    },
    {
      category: 'Protein',
      foods: ['Chicken breast', 'Beef', 'Pork', 'Fish', 'Fish tots', 'Ikan bilis', 'Prawn', 'Sotong', 'Tofu', 'Egg tofu', 'Eggs', 'Liver'],
    },
    {
      category: 'Fruits',
      foods: ['Banana', 'Papaya', 'Mango', 'Grape', 'Watermelon', 'Kismis'],
    },
    {
      category: 'Others',
      foods: ['Oat', 'Banana pancake', 'Omelette veggie', 'Spaghetti + pumpkin pesto'],
    },
  ],
  8: [
    {
      category: 'Vegetable',
      foods: ['Kangkung', 'Bayam', 'Cucumber', 'Purple cabbage', 'Carrot', 'Broccoli', 'Corn', 'Pumpkin', 'Sweet potato', 'Zucchini', 'Yellow capsicum', 'Red capsicum', 'Sweet pea', 'Mushroom', 'Mix veggie'],
    },
    {
      category: 'Protein',
      foods: ['Chicken breast', 'Beef', 'Pork', 'Fish', 'Fish tots', 'Ikan bilis', 'Prawn', 'Sotong', 'Tofu', 'Egg tofu', 'Eggs', 'Liver'],
    },
    {
      category: 'Fruits',
      foods: ['Banana', 'Papaya', 'Mango', 'Grape', 'Kismis'],
    },
    {
      category: 'Others',
      foods: ['Oat', 'Banana pancake', 'Omelette veggie', 'Spaghetti + pumpkin pesto'],
    },
  ],
}

export const CATEGORY_ICONS = {
  Vegetable: '🥦',
  Protein:   '🍗',
  Fruits:    '🍎',
  Others:    '🧀',
}
