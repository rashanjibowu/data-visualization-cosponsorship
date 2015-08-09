# Visualizing Cosponsorship in the Senate
Rashan Jibowu  
08/08/2015  


```r
library(plyr)
```

Analysis Setup


```r
basePath <- c("./data/cosponsorship2010/")

# set up paths to the data
path.senate_bills <- paste0(basePath, "senate_bills.txt")
path.senate_members <- paste0(basePath, "senate_members/110_senators.txt")
path.senate_matrix <- paste0(basePath, "senate_matrices/110_senmatrix.txt")

# load the data
bills <- read.csv(path.senate_bills, header = FALSE)
senators <- read.csv(path.senate_members, header = FALSE)
cosponsorship <- read.csv(path.senate_matrix, header = FALSE)

str(bills)
```

```
## 'data.frame':	136373 obs. of  4 variables:
##  $ V1: int  93 93 93 93 93 93 93 93 93 93 ...
##  $ V2: Factor w/ 5 levels "SC","SE","SJ",..: 1 1 1 1 1 1 1 1 1 1 ...
##  $ V3: int  1 10 100 101 102 103 104 105 106 107 ...
##  $ V4: int  0 0 0 0 0 0 0 0 0 0 ...
```

```r
str(senators)
```

```
## 'data.frame':	102 obs. of  3 variables:
##  $ V1: Factor w/ 102 levels "Akaka  Daniel K.",..: 1 2 3 4 5 6 7 8 9 10 ...
##  $ V2: int  7 1695 11 1881 66 1572 1280 1284 1285 1286 ...
##  $ V3: int  14400 40304 29108 40707 14203 49901 49307 14101 14912 15501 ...
```

```r
#str(cosponsorship)
```

Clean data


```r
# Make the column names for senate bills human readable
colnames(bills) <- c("CongressNum", "BillType", "BillNum", "IsPrivate")
head(bills)
```

```
##   CongressNum BillType BillNum IsPrivate
## 1          93       SC       1         0
## 2          93       SC      10         0
## 3          93       SC     100         0
## 4          93       SC     101         0
## 5          93       SC     102         0
## 6          93       SC     103         0
```

```r
# subset for the 110th Congress
rBills <- bills[bills$CongressNum == 110,]

# Make the column names for senate members human readable
colnames(senators) <- c("Name", "THOMAS_ID", "ICPSR_ID")
head(senators)
```

```
##               Name THOMAS_ID ICPSR_ID
## 1 Akaka  Daniel K.         7    14400
## 2 Alexander  Lamar      1695    40304
## 3    Allard  Wayne        11    29108
## 4   Barrasso  John      1881    40707
## 5      Baucus  Max        66    14203
## 6       Bayh  Evan      1572    49901
```

```r
# create unique bill Ids
billID <- paste0(rBills$BillType, rBills$BillNum);

# Each column in the matrix represents a bill facing the senate
colnames(cosponsorship) <- billID

# Each row in the matrix represents a senator
rownames(cosponsorship) <- senators[,c("Name")]

# test out the structure of the cosponsorship data frame
cosponsorship[1:5,1:5]
```

```
##                  SC1 SC10 SC100 SC101 SC102
## Akaka  Daniel K.   0    0     0     0     0
## Alexander  Lamar   2    0     0     0     0
## Allard  Wayne      1    0     0     0     0
## Barrasso  John     2    0     0     0     0
## Baucus  Max        0    2     0     0     0
```

Make sense of the data

According to the codebook, the cosponsorship data can take one of several values:

Value | Meaning
------|--------
`1` | Congressman `i` sponsored bill `j`
`2` | Congressman `i` cosponsored bill `j`
`3` | Congressman `i` cosponsored bill `j` after withdrawing the previous cosponsorship from bill `j`
`5` | Congressman `i` withdrew a cosponsorship from bill `j`

So, to identify those bills with cosponsorship, we are looking for values 1, 2 and 3.
Values of 1 help us identify the original sponsor
Values of 2 and 3 help us identify the co-sponsors

This forms the basis of a social graph where senators are nodes and the bills that they have jointly sponsored represent the edges

First, let's find all bills that have cosponsorship


```r
# remove columns (bills) that don't have cosponsorship
nocosponsor <- (colSums(cosponsorship) <= 1)

filtered <- cosponsorship[,!nocosponsor]
dim(filtered)
```

```
## [1]  102 5789
```

```r
# if a column has only 1's, 0's and 5's, we should remove it because all cosponsors dropped out

noalldropout <- logical()

for (i in 1:ncol(filtered)) {
    noalldropout[i] <- any(filtered[,i] %in% c(2,3))
}

head(noalldropout)
```

```
## [1] TRUE TRUE TRUE TRUE TRUE TRUE
```

```r
filtered2 <- filtered[,noalldropout]

dim(filtered2)
```

```
## [1]  102 5786
```

Now, let's remove any senators without any activity


```r
lazysenator <- rowSums(filtered2) < 1

filtered2[lazysenator, 1]
```

```
## integer(0)
```

