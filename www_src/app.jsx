import moment from 'moment-timezone';

import _ from 'lodash';

import uuid from 'uuid';

import request from 'request';
const request_gmaps = request.defaults({ baseUrl: 'https://maps.googleapis.com/maps/api', qs: { key: 'AIzaSyAWHMnKbbRjlD-u8epP_87n3dps-ASCPJo' } });

import React from 'react';
import ReactDOM from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import 'roboto-fontface/css/roboto-fontface.css';

import AppBar from 'material-ui/AppBar';
import AppCanvas from 'material-ui/internal/AppCanvas';
import Dialog from 'material-ui/Dialog';
import Divider from 'material-ui/Divider';
import Drawer from 'material-ui/Drawer';
import FlatButton from 'material-ui/FlatButton';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import FontIcon from 'material-ui/FontIcon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import LinearProgress from 'material-ui/LinearProgress';
import {List, ListItem} from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';
import Subheader from 'material-ui/Subheader';
import {Tabs, Tab} from 'material-ui/Tabs';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';



import L from 'leaflet';
L.Icon.Default.imagePath = 'images/leaflet/';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';

import 'script!../node_modules/leaflet.icon.glyph/Leaflet.Icon.Glyph.js';



import 'font-awesome/css/font-awesome.min.css';



import './css/app.css';



class Main extends React.Component {
    state = {
        show_menu: false,
        show_info: false,
        show_routes: false,
        show_confirm: false,
        notifications: [],
        market: [],
        embarked: null
    };

    componentWillMount = () => {
        this.routes = [];
    };
    componentDidMount = () => {
        const map = this.map = L.map(ReactDOM.findDOMNode(this.refs.map), {
            zoomControl: false,
            attributionControl: false
        }).fitWorld();

        map.on('click', this._find_routes);

        const tiles = this.tiles = L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png').addTo(map);

        this.me = L.layerGroup().addTo(map);
        this.destination = L.layerGroup().addTo(map);

        navigator.geolocation.getCurrentPosition(this._locate, undefined, {
            maximumAge: 30000,
            timeout: 60000,
            enableHighAccuracy: false
        });
    };
    componentWillUnmount = () => {
        
    };

    getChildContext = () => {
        return {
            muiTheme: getMuiTheme(lightBaseTheme)
        };
    };

    _find_routes = (destination) => {
        this.destination.clearLayers();
        this.destination.addLayer(L.marker(destination.latlng, {
            icon: L.icon.glyph({
                prefix: 'fa',
                glyph: 'fa-flag-checkered'
            })
        }));

        request_gmaps.get({
            uri: '/directions/json',
            qs: {
                mode: 'transit',
                origin: this.position.coords.latitude + ',' + this.position.coords.longitude,
                destination: destination.latlng.lat + ',' + destination.latlng.lng
            },

            json: true
        }, (error, response, body) => {
            const dir_def = body;
            dir_def.routing_preference = 'less time';

            request_gmaps.get({
                uri: '/directions/json',
                qs: {
                    mode: 'transit',
                    origin: this.position.coords.latitude + ',' + this.position.coords.longitude,
                    destination: destination.latlng.lat + ',' + destination.latlng.lng,
                    transit_routing_preference: 'less_walking'
                },

                json: true
            }, (error, response, body) => {
                const dir_lw = body;
                dir_lw.routing_preference = 'less walking';

                request_gmaps.get({
                    uri: '/directions/json',
                    qs: {
                        mode: 'transit',
                        origin: this.position.coords.latitude + ',' + this.position.coords.longitude,
                        destination: destination.latlng.lat + ',' + destination.latlng.lng,
                        transit_routing_preference: 'fewer_transfers'
                    },

                    json: true
                }, (error, response, body) => {
                    const dir_ft = body;
                    dir_ft.routing_preference = 'fewer transfers';

                    this.routes = _.uniqWith([dir_def, dir_lw, dir_ft], (arrVal, othVal) => {
                        return _.isEqual(arrVal.routes[0].legs[0].steps.map((step) => step.html_instructions), othVal.routes[0].legs[0].steps.map((step) => step.html_instructions));
                    }).filter((route) => route.routes[0].legs[0].steps.map((step) => step.travel_mode).indexOf('TRANSIT') > -1).map((route) => {
                        const dur = this.state.market.filter((ticket) => ticket.entry.clone().add(ticket.remaining, 'minutes').diff(moment(), 'seconds') > route.routes[0].legs[0].duration.value).map((ticket) => ticket.entry.clone().add(ticket.remaining, 'minutes').diff(moment(), 'minutes')).sort()[0];

                        route.price = ((dur - 2) * 1.4 / 90 + 0.04).toFixed(2);

                        return route;
                    });

                    this.setState({show_routes: true});
                });
            });
        });
    };

    _locate = (position) => {
        this.map.fitBounds(L.circle([position.coords.latitude, position.coords.longitude], position.coords.accuracy).getBounds());

        this.me.clearLayers();

        this.me.addLayer(L.circleMarker([position.coords.latitude, position.coords.longitude], {
            fillColor: this.getChildContext().muiTheme.palette.primary1Color,
            fillOpacity: 0.9,
            weight: 0
        }).setRadius(10));
        this.me.addLayer(L.circleMarker([position.coords.latitude, position.coords.longitude], {
            fillOpacity: 0.0,
            weight: 2,
            color: this.getChildContext().muiTheme.palette.primary1Color,
            opacity: 0.9
        }).setRadius(13));
        this.me.addLayer(L.circle([position.coords.latitude, position.coords.longitude], position.coords.accuracy, {
            fillColor: this.getChildContext().muiTheme.palette.primary1Color,
            fillOpacity: 0.1,
            weight: 0
        }));

        this.map.panTo([position.coords.latitude, position.coords.longitude]);

        this.position = position;
    };

    _locateManual = () => {
        navigator.geolocation.getCurrentPosition(this._locate, undefined, {
            maximumAge: 0,
            timeout: 10000,
            enableHighAccuracy: true
        });
    };

    _invest = () => {
        const market = _.clone(this.state.market);
        const notifications = _.clone(this.state.notifications);
        const remaining = 90 - moment().diff(this.state.embarked, 'minutes');
        if (remaining >= 5) {
            market.push({
                entry: moment(),
                remaining: remaining
            });

            notifications.push({key: uuid.v4(), text: 'Invested ' + remaining + ' minutes', icon: 'fa fa-bell'});
        }

        this.setState({notifications: notifications, market: market, embarked: null, show_confirm: false});
    };
    _donate = () => {
        const market = _.clone(this.state.market);
        const notifications = _.clone(this.state.notifications);
        const remaining = 90 - moment().diff(this.state.embarked, 'minutes');
        if (remaining >= 5) {
            market.push({
                entry: moment(),
                remaining: remaining
            });

            notifications.push({key: uuid.v4(), text: 'Donated ' + remaining + ' minutes', icon: 'fa fa-bell'});
        }

        this.setState({notifications: notifications, market: market, embarked: null, show_confirm: false});
    };

    render = () => {
        return (
            <AppCanvas>
                <div ref='map' style={{height: '100%'}} />

                <FloatingActionButton mini={true} backgroundColor='transparent' style={{backgroundColor: 'transparent', boxShadow: 'none', position: 'fixed', bottom: this.getChildContext().muiTheme.spacing.desktopGutterMini + 'px', left: this.getChildContext().muiTheme.spacing.desktopGutterMini + 'px'}} iconClassName='fa fa-bars' iconStyle={{color: this.getChildContext().muiTheme.palette.primary1Color}} onTouchTap={() => this.setState({show_menu: true})} />

                <Drawer open={this.state.show_menu} docked={false} onRequestChange={(open) => this.setState({show_menu: open})}>
                    <AppBar title='Pass It On' iconClassNameLeft='fa fa-bars' />

                    <List>
                        <ListItem primaryText='Locate' leftIcon={<FontIcon className='fa fa-location-arrow' />} onTouchTap={this._locateManual} />
                        {this.state.embarked ?
                            <ListItem primaryText='End Trip' leftIcon={<FontIcon className='fa fa-flag-checkered' />} onTouchTap={() => this.setState({show_confirm: true})} />
                        :
                            <ListItem primaryText='Board & Buy Ticket' leftIcon={<FontIcon className='fa fa-money' />} onTouchTap={() => this.setState({embarked: moment()})} />
                        }
                        <ListItem primaryText='Information' leftIcon={<FontIcon className='fa fa-info-circle' />} onTouchTap={() => this.setState({show_info: true})} />
                    </List>
                    <Divider />
                    <List>
                        <Subheader>DIRECTIONS</Subheader>
                        <TextField hintText='Origin' fullWidth={true} />
                        <TextField hintText='Destination' fullWidth={true} />
                        <RaisedButton label='Find Routes' primary={true} icon={<FontIcon className='fa fa-search' />} />
                    </List>
                    <Divider />
                    <List>
                        <Subheader>NOTIFICATIONS</Subheader>
                        {this.state.notifications.map((notification) => (<ListItem key={notification.key} primaryText={notification.text} leftIcon={<FontIcon className={notification.icon} />} onTouchTap={(event) => {console.log(event); const notifications = _.clone(this.state.notifications); this.setState({notifications: notifications.filter((_notification) => _notification.key == notification.key)});}} />))}
                    </List>
                    <List>
                        <Subheader>MARKET</Subheader>
                        {this.state.market.map((ticket) => (<ListItem primaryText={ticket.entry.clone().add(ticket.remaining, 'minutes').diff(moment(), 'minutes') + ' minutes left'} leftIcon={<FontIcon className='fa fa-ticket' />} />))}
                    </List>
                </Drawer>

                <Dialog title='Available Routes' autoScrollBodyContent={true} open={this.state.show_routes} onRequestClose={() => this.setState({show_routes: false})}>
                    {this.routes.map((route) => (
                        <div key={route.routing_preference}>
                            <List>
                                <Subheader>{route.routing_preference + ': ' + route.routes[0].legs[0].duration.text + ', ' + route.price + ' Euro'}</Subheader>
                                {route.routes[0].legs[0].steps.map((step) => (<ListItem key={step.html_instructions} primaryText={step.html_instructions} secondaryText={step.transit_details ? step.transit_details.line.short_name : ''} />))}
                                <RaisedButton label='Buy' primary={true} icon={<FontIcon className='fa fa-money' />} style={{marginTop: this.getChildContext().muiTheme.spacing.desktopGutterMini + 'px', marginBottom: this.getChildContext().muiTheme.spacing.desktopGutterMini + 'px'}} onTouchTap={() => {
                                    request.put({
                                        uri: 'https://nbgdemo.azure-api.net/nodeopenapi/api/transactions/rest',
                                        headers: {
                                            'Ocp-Apim-Subscription-Key': '4b88a7c2b4f7429894465989d1f9f83c'
                                        },
                                        json: {
                                            "nbgtrackid": 'a1afe52d-1210-4e32-b891-b4599701a9f3',
                                            "payload": {
                                                "insert": {
                                                    "uuid": 'a1afe52d-1210-4e32-b891-b4599701a9f3',
                                                    "details": {
                                                        "status": "OK",
                                                        "description": "payment",
                                                        "completed": "OK",
                                                        "value": {
                                                            "currency": "EUR",
                                                            "amount": route.price
                                                        }
                                                    },
                                                    "this_account": '571a174195806d5414110f21',
                                                    "other_account": '571b705bfef762f41112f773'
                                                }
                                            }
                                        }
                                }, (error, response, body) => {
                                    const notifications = _.clone(this.state.notifications);
                                    notifications.push({key: uuid.v4(), text: 'Bought ticket', icon: 'fa fa-bell'});
                                    this.setState({show_routes: false, notifications: notifications});
                                    });
                                }} />
                            </List>
                        </div>
                    ))}
                </Dialog>

                <Dialog title='Invest' open={this.state.show_confirm} onRequestClose={() => this.setState({show_confirm: false})}>
                    <RaisedButton label='Invest' primary={true} onTouchTap={this._invest} />
                    <RaisedButton label='Donate' primary={true} onTouchTap={this._donate} />
                </Dialog>

                <Dialog title='Information' open={this.state.show_info} onRequestClose={() => this.setState({show_info: false})}>
                    <p>Pass It On is a fintech app.</p>
                </Dialog>
            </AppCanvas>
        );
    };
}

Main.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired
};

document.addEventListener('deviceready', () => {
    ReactDOM.render(<Main />, document.getElementById('app'));
}, false);
