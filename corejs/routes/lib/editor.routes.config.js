const {EditorController} =require('../../controllers');
const {DefaultRoutesConfig} =require('./default.routes.config');
const { dbStore} =require('../../common/customTypes/types.config');
const {uploadSchema} = require('./upload');


 async function EditorRoutes(){
    
    return dbStore['user'] ? await Promise.resolve( await DefaultRoutesConfig.instance('editor', await EditorController.createInstance('editor'), 
    (self)=>{

 self.post([uploadSchema], false);
 self.getId();
 self.getList();
 self.put();
 self.delete()
})) : console.log('User model is not avaliable in dbStore No Schema routes configuered');
};
exports.EditorRoutes = EditorRoutes;

