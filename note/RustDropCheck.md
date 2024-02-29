记录一下对rust的drop check的学习。

在rust里面，有borrow check的存在，这好像会让我们永远也不会读到一个垂悬指针，但是其实这是有问题的。因为如果要假设以上是对的，会默认一个规则  -- 在`'a : 'b`的情况下，a和b的生命周期是一样的。

但是很明显，rust的生命周期并没有这么简单。比如 在同一个代码块里面定义两个变量
```Rust
let x ;
let y ;
```
上面的代码实际脱糖为：
```rust
{
	let x;
	{
		let y;
	}
}
```
也就是说，y会比x先被释放掉。
在rust里面 变量的释放顺序和定义顺序相反。在结构提或者元组里面，字段会按顺序进行释放。这里和c似乎是一样的 ，详细的变量释放顺序可以看这个 [RFC 1857](https://github.com/rust-lang/rfcs/blob/master/text/1857-stabilize-drop-order.md)

也就是说，在变量drop的时候，如果在访问结构体的内部字段，没有按照drop的顺序访问的话，就会发生use after free。

所以rust引入了drop check， 来保证不会发生垂选引用，而drop check其实就是把结构体内不一样的生命周期都看成是一样长，这样就符合borrow check不会引发垂选引用的标准了。当然 rust 在这之后可能会推出更智能的drop check。

先看一段例子,这是构建了一个自引用的结构体
```rust
struct Inspector<'a>(&'a u8);
struct World<'a> {
	inspector: Option<Inspector<'a>>,
	days: Box<u8>,
}
#[test]
fn test() {
	let mut world = World {
		inspector: None,
		days: Box::new(1),
	};
	world.inspector = Some(Inspector(&world.days));
}
```

这可以完全正常的编译，因为此时，`inspector` 和`days`的生命周期谁更长根本不重要，因为在drop的不会访问，不会发生use after free。

但是一旦加上drop,drop check就会立马抛出问题。
```rust

struct Inspector<'a>(&'a u8);

impl<'a> Drop for Inspector<'a> {
    fn drop(&mut self) {
        println!("do sth");
    }
}

struct World<'a> {
    inspector: Option<Inspector<'a>>,
    days: Box<u8>,
}

fn main() {
    let mut world = World {
        inspector: None,
        days: Box::new(1),
    };
    world.inspector = Some(Inspector(&world.days));
}
```

这是报错 

```
error[E0597]: `world.days` does not live long enough
  --> src/drop_test.rs:58:38
   |
54 |     let mut world = World {
   |         --------- binding `world` declared here
...
58 |     world.inspector = Some(Inspector(&world.days));
   |                                      ^^^^^^^^^^^ borrowed value does not live long enough
59 | }
   | -
   | |
   | `world.days` dropped here while still borrowed
   | borrow might be used here, when `world` is dropped and runs the destructor for type `World<'_>`
```

但是也好像不对，我在drop里面明明没有对数据的访问，为什么此时还是会出问题

这是因为rust无法保证在drop里面到底有没有对内部数据的访问。所以一律认为有问题。

因为`inspector`是对 `days`的一个借用,那么显然，后者必须比前者活得更久，这个程序才算正确的。按照drop的顺序 ， 在`World`结构体的内部，是`inspector`先释放`days`后释放。 

那么这么说，好像程序是对的，并没有出错。为什么rust还是会抛出错误。实际上，这正是rust drop check的实现问题，就像上面提到的，drop check会认为内部变量的生命周期都是一样的，所以这里就会出错。

当成程序是对的，实际上却不允许运行，这显然也有问题。rust官方也提出了解决办法 ————    `#[may_dangle]` ,利用这个标签可以取消rust的drop check,显然这是unsafe的，当取消rust的drop check 之后，我们就必须自己保证rust的代码的安全问题。

加入`#[may_dangle]`来试一试刚才的代码
```rust

#![feature(dropck_eyepatch)]
struct Inspector<'a>(&'a u8);

unsafe impl<#[may_dangle] 'a> Drop for Inspector<'a> {
    fn drop(&mut self) {
        println!("I read {} ", self.0);
    }
}

struct World<'a> {
    inspector: Option<Inspector<'a>>,
    days: Box<u8>,
}

fn main() {
    let mut world = World {
        days: Box::new(1),
        inspector: None,
    };
    world.inspector = Some(Inspector(&world.days));
}    
```
很好，没报错，运行一次
```shell
I read 1
```
运行也是正确的。

按照我们原来的分析，`days`的生命周期是比`inspector`长的，所以这里不会出问题，那结构体内部的变量生命周期与位置有关，前面的先释放，后面的后释放，那么如果将`days`和`inspector`调换一下顺序，这里就制造了一个use after free，输出的什么东西应该是无法预测的

调换顺序试一下

```rust
#![feature(dropck_eyepatch)]
struct Inspector<'a>(&'a u8);

unsafe impl<#[may_dangle] 'a> Drop for Inspector<'a> {
    fn drop(&mut self) {
        println!("I read {} ", self.0);
    }
}

struct World<'a> {
    days: Box<u8>,
    inspector: Option<Inspector<'a>>,
}

fn main() {
    let mut world = World {
        days: Box::new(1),
        inspector: None,
    };
    world.inspector = Some(Inspector(&world.days));
}
```
没报错，运行一下
```rust
I read 240 
```
不是我们预设的1，再来一下
```shell
I read 70 
```
又是一个新数字，看来确实引发了use after free

所以在使用了`#[may dangle]`之后，确实会引发不安全的事情发生，但是其实也能避免，就是确保数据不会在释放之后以任何形式被访问，包括直接访问和间接访问。