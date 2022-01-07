// 生成统一分页请求格式
exports.PageLimit = function (params,page) {
    const {page_size,page_num} = params || {};
    const num = Number(page ? page[0] : page_num);
    const size = Number(page ? page[1] :page_size);
    return `${size*(num-1)},${size*num}`
}