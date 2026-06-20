export default defineAppConfig({
  pages: [
    'pages/order-query/index',
    'pages/risk-alert/index',
    'pages/mine/index',
    'pages/order-detail/index',
    'pages/confirm-arrival/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165dff',
    navigationBarTitleText: '冷链安全',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/order-query/index',
        text: '订单查询'
      },
      {
        pagePath: 'pages/risk-alert/index',
        text: '风险提醒'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
