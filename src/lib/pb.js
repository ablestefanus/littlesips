import PocketBase from 'pocketbase'

const pb = new PocketBase('https://api.littlesips.be')
pb.autoCancellation(false)

export default pb
